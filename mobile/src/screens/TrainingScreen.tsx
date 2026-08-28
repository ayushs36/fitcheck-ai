import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { TrainingAnalyticsCard } from "../components/TrainingAnalyticsCard";
import {
  addWorkoutSession,
  deleteWorkoutSessionById,
  loadRecentWorkoutSessions,
  loadUserSettings,
  upsertWorkoutSession,
} from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { ExerciseDraft, WorkoutDraft, WorkoutSession, WorkoutType } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { formatWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import {
  createBlankExercise,
  createBlankSet,
  createBlankWorkoutDraft,
  createWorkoutDraftFromSession,
  createWorkoutSessionFromDraft,
} from "../utils/workoutDraft";

const workoutTypes: WorkoutType[] = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Cardio",
  "Rest",
  "Other",
];

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase();
}

function formatSetPreview(
  set: WorkoutSession["exercises"][number]["sets"][number],
  unitSystem: UnitSystem,
) {
  const reps = typeof set.reps === "number" ? `${set.reps} reps` : "reps blank";
  const load = set.isBodyweight
    ? "bodyweight"
    : typeof set.weightLbs === "number"
      ? `${formatWeightFromLbs(set.weightLbs, unitSystem)} ${getWeightUnitLabel(unitSystem)}`
      : "load blank";

  return `${reps} @ ${load}${set.formFocus ? " - form focus" : ""}`;
}

function getLastExercisePerformance(
  exerciseName: string,
  workoutType: WorkoutType,
  sessions: WorkoutSession[],
  unitSystem: UnitSystem,
) {
  const normalizedExerciseName = normalizeExerciseName(exerciseName);

  if (!normalizedExerciseName || workoutType === "Rest") {
    return null;
  }

  for (const session of sessions) {
    if (session.type !== workoutType) {
      continue;
    }

    const matchedExercise = session.exercises.find(
      (exercise) => normalizeExerciseName(exercise.name) === normalizedExerciseName,
    );

    if (!matchedExercise) {
      continue;
    }

    const setSummary = matchedExercise.sets
      .slice(0, 4)
      .map((set) => formatSetPreview(set, unitSystem))
      .join(", ");

    return {
      dateLabel: formatReadableDate(session.date),
      muscleGroup: matchedExercise.muscleGroup || "Saved exercise",
      setSummary: setSummary || "No sets saved",
    };
  }

  return null;
}

export function TrainingScreen() {
  const todayKey = useMemo(() => getTodayKey(), []);
  const [draft, setDraft] = useState<WorkoutDraft>(() => createBlankWorkoutDraft());
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  async function refreshSessions() {
    const [sessions, settings] = await Promise.all([
      loadRecentWorkoutSessions(20),
      loadUserSettings(),
    ]);
    setRecentSessions(sessions);
    setUnitSystem(settings?.unitSystem ?? "imperial");
  }

  useEffect(() => {
    refreshSessions();
  }, []);

  function updateExercise(exerciseId: string, nextExercise: ExerciseDraft) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId ? nextExercise : exercise,
      ),
    }));
  }

  function addExercise() {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: [...currentDraft.exercises, createBlankExercise()],
    }));
  }

  function addSavedExercise(savedExercise: Pick<ExerciseDraft, "name" | "muscleGroup">) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: [
        ...currentDraft.exercises,
        {
          ...createBlankExercise(),
          name: savedExercise.name,
          muscleGroup: savedExercise.muscleGroup,
        },
      ],
    }));
  }

  function removeExercise(exerciseId: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  }

  function selectWorkoutType(type: WorkoutType) {
    setDraft((currentDraft) => {
      if (type === "Rest") {
        return {
          ...currentDraft,
          type,
          exercises: [],
        };
      }

      if (currentDraft.type === "Rest") {
        return createBlankWorkoutDraft(type);
      }

      return {
        ...currentDraft,
        type,
      };
    });
  }

  function useLastWorkout() {
    const matchingWorkout = recentSessions.find(
      (session) => session.type === draft.type && session.exercises.length > 0,
    );
    const fallbackWorkout = recentSessions.find((session) => session.exercises.length > 0);
    const sourceWorkout = matchingWorkout ?? fallbackWorkout;

    if (!sourceWorkout) {
      Alert.alert("No previous workout", "Save a workout first, then you can reuse it here.");
      return;
    }

    setDraft(createWorkoutDraftFromSession(sourceWorkout, unitSystem));
    setEditingSession(null);
    setLastSavedAt(null);
  }

  function editWorkout(session: WorkoutSession) {
    setEditingSession(session);
    setDraft(createWorkoutDraftFromSession(session, unitSystem));
    setLastSavedAt(null);
  }

  function cancelEditWorkout() {
    setEditingSession(null);
    setDraft(createBlankWorkoutDraft(draft.type));
    setLastSavedAt(null);
  }

  function addSet(exerciseId: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, createBlankSet()] }
          : exercise,
      ),
    }));
  }

  async function saveWorkout() {
    const draftedWorkoutSession = createWorkoutSessionFromDraft({
      date: editingSession?.date ?? todayKey,
      draft,
      unitSystem,
    });

    if (draftedWorkoutSession.exercises.length === 0 && draft.type !== "Rest") {
      Alert.alert("Add an exercise", "Name at least one exercise before saving this workout.");
      return;
    }

    const workoutSession = editingSession
      ? {
          ...draftedWorkoutSession,
          id: editingSession.id,
          date: editingSession.date,
          createdAt: editingSession.createdAt,
        }
      : draftedWorkoutSession;
    const sessions = editingSession
      ? await upsertWorkoutSession(workoutSession)
      : await addWorkoutSession(workoutSession);

    setRecentSessions(sessions.slice(0, 20));
    setEditingSession(null);
    setDraft(createBlankWorkoutDraft(draft.type));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert(
      editingSession ? "Workout updated" : "Workout saved",
      editingSession
        ? "Your saved workout was updated on this device."
        : "Your workout was saved on this device.",
    );
  }

  function deleteWorkout(session: WorkoutSession) {
    Alert.alert(
      "Delete this workout?",
      `${formatReadableDate(session.date)} ${session.type} will be removed from your training analytics.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const sessions = await deleteWorkoutSessionById(session.id);
            setRecentSessions(sessions.slice(0, 20));
            if (editingSession?.id === session.id) {
              setEditingSession(null);
              setDraft(createBlankWorkoutDraft(draft.type));
            }
            Alert.alert("Workout deleted", "The workout was removed from this device.");
          },
        },
      ],
    );
  }

  const savedExercisesForWorkout = useMemo(() => {
    const savedExercises = new Map<string, Pick<ExerciseDraft, "name" | "muscleGroup">>();

    recentSessions
      .filter((session) => session.type === draft.type)
      .forEach((session) => {
        session.exercises.forEach((loggedExercise) => {
          const exerciseName = loggedExercise.name.trim();
          const normalizedName = exerciseName.toLowerCase();

          if (!exerciseName || savedExercises.has(normalizedName)) {
            return;
          }

          savedExercises.set(normalizedName, {
            name: exerciseName,
            muscleGroup: loggedExercise.muscleGroup || "Saved",
          });
        });
      });

    return Array.from(savedExercises.values()).slice(0, 8);
  }, [draft.type, recentSessions]);
  const isRestDay = draft.type === "Rest";
  const weightUnit = getWeightUnitLabel(unitSystem);
  const visibleRecentSessions = recentSessions.slice(0, 5);

  return (
    <Screen
      title="Training"
      subtitle="Log exercises, sets, reps, weight, bodyweight work, and form-focus notes."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingSession ? formatReadableDate(editingSession.date) : formatReadableDate(todayKey)}
          </Text>
          <Text style={styles.body}>
            {editingSession
              ? `Editing saved ${editingSession.type} workout`
              : "Workout session"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Workout type</Text>
          <View style={styles.typeGrid}>
            {workoutTypes.map((type) => {
              const isSelected = draft.type === type;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={type}
                  onPress={() => selectWorkoutType(type)}
                  style={[styles.typeChip, isSelected && styles.selectedTypeChip]}
                >
                  <Text style={[styles.typeText, isSelected && styles.selectedTypeText]}>{type}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isRestDay ? (
          <View style={styles.restState}>
            <Text style={styles.restTitle}>Rest day selected</Text>
            <Text style={styles.body}>
              Save a rest day with notes for recovery, soreness, sleep, or mobility. No exercises
              are needed.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.quickActions}>
              <Pressable
                accessibilityRole="button"
                onPress={useLastWorkout}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Use Last Workout</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={addExercise}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Add Custom Exercise</Text>
              </Pressable>
            </View>

            {savedExercisesForWorkout.length ? (
              <View style={styles.section}>
                <Text style={styles.label}>Previously logged for {draft.type}</Text>
                <View style={styles.templateGrid}>
                  {savedExercisesForWorkout.map((savedExercise) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`${savedExercise.name}-${savedExercise.muscleGroup}`}
                      onPress={() => addSavedExercise(savedExercise)}
                      style={styles.savedExerciseChip}
                    >
                      <Text style={styles.templateName}>{savedExercise.name}</Text>
                      <Text style={styles.templateMeta}>{savedExercise.muscleGroup || "Saved"}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}

        {!isRestDay && draft.exercises.map((exercise, exerciseIndex) => {
          const exercisePreview = getLastExercisePerformance(
            exercise.name,
            draft.type,
            recentSessions,
            unitSystem,
          );

          return (
          <View key={exercise.id} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseTitle}>Exercise {exerciseIndex + 1}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => removeExercise(exercise.id)}
                style={styles.removeExerciseButton}
              >
                <Text style={styles.removeExerciseText}>Delete</Text>
              </Pressable>
            </View>

            <TextField
              label="Exercise name"
              onChangeText={(value) => updateExercise(exercise.id, { ...exercise, name: value })}
              placeholder="Bench press, pull-up, squat"
              value={exercise.name}
            />
            <TextField
              label="Muscle group"
              onChangeText={(value) =>
                updateExercise(exercise.id, { ...exercise, muscleGroup: value })
              }
              placeholder="Chest, back, legs"
              value={exercise.muscleGroup}
            />

            {exercisePreview ? (
              <View style={styles.exercisePreview}>
                <View style={styles.exercisePreviewHeader}>
                  <Text style={styles.exercisePreviewLabel}>Last performance</Text>
                  <Text style={styles.exercisePreviewDate}>{exercisePreview.dateLabel}</Text>
                </View>
                <Text style={styles.exercisePreviewTitle}>{exercisePreview.muscleGroup}</Text>
                <Text style={styles.exercisePreviewBody}>{exercisePreview.setSummary}</Text>
              </View>
            ) : null}

            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setBlock}>
                <Text style={styles.setTitle}>Set {setIndex + 1}</Text>
                <View style={styles.setGrid}>
                  <TextField
                    keyboardType="number-pad"
                    label="Reps"
                    onChangeText={(value) =>
                      updateExercise(exercise.id, {
                        ...exercise,
                        sets: exercise.sets.map((currentSet) =>
                          currentSet.id === set.id ? { ...currentSet, reps: value } : currentSet,
                        ),
                      })
                    }
                    placeholder="blank"
                    value={set.reps}
                  />
                  <TextField
                    editable={!set.isBodyweight}
                    keyboardType="decimal-pad"
                    label="Weight"
                    onChangeText={(value) =>
                      updateExercise(exercise.id, {
                        ...exercise,
                        sets: exercise.sets.map((currentSet) =>
                          currentSet.id === set.id
                            ? { ...currentSet, weightLbs: value }
                            : currentSet,
                        ),
                      })
                    }
                    placeholder={set.isBodyweight ? "bodyweight" : weightUnit}
                    value={set.isBodyweight ? "" : set.weightLbs}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      updateExercise(exercise.id, {
                        ...exercise,
                        sets: exercise.sets.map((currentSet) =>
                          currentSet.id === set.id
                            ? {
                                ...currentSet,
                                isBodyweight: !currentSet.isBodyweight,
                                weightLbs: "",
                              }
                            : currentSet,
                        ),
                      })
                    }
                    style={[styles.toggleChip, set.isBodyweight && styles.activeToggleChip]}
                  >
                    <Text style={[styles.toggleText, set.isBodyweight && styles.activeToggleText]}>
                      Bodyweight
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      updateExercise(exercise.id, {
                        ...exercise,
                        sets: exercise.sets.map((currentSet) =>
                          currentSet.id === set.id
                            ? { ...currentSet, formFocus: !currentSet.formFocus }
                            : currentSet,
                        ),
                      })
                    }
                    style={[styles.toggleChip, set.formFocus && styles.activeToggleChip]}
                  >
                    <Text style={[styles.toggleText, set.formFocus && styles.activeToggleText]}>
                      Form focus
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => addSet(exercise.id)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Add Set</Text>
            </Pressable>
          </View>
          );
        })}

        <TextField
          label="Workout notes"
          multiline
          onChangeText={(value) => setDraft((currentDraft) => ({ ...currentDraft, notes: value }))}
          placeholder="Energy, soreness, pump, mind-muscle connection"
          style={styles.notesInput}
          value={draft.notes}
        />

        <Pressable accessibilityRole="button" onPress={saveWorkout} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {editingSession ? "Update Workout" : "Save Workout"}
          </Text>
        </Pressable>

        {editingSession ? (
          <Pressable
            accessibilityRole="button"
            onPress={cancelEditWorkout}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
          </Pressable>
        ) : null}

        {lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.title}>Recent Workouts</Text>
        {visibleRecentSessions.length === 0 ? (
          <Text style={styles.body}>No workouts saved yet.</Text>
        ) : (
          <View style={styles.sessionList}>
            {visibleRecentSessions.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionCopy}>
                    <Text style={styles.sessionDate}>{formatReadableDate(session.date)}</Text>
                    <Text style={styles.body}>
                      {session.exercises.length}{" "}
                      {session.exercises.length === 1 ? "exercise" : "exercises"}
                    </Text>
                  </View>
                  <View style={styles.sessionActions}>
                    <Text style={styles.sessionType}>{session.type}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => editWorkout(session)}
                      style={styles.editSessionButton}
                    >
                      <Text style={styles.editSessionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => deleteWorkout(session)}
                      style={styles.deleteSessionButton}
                    >
                      <Text style={styles.deleteSessionText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <TrainingAnalyticsCard sessions={recentSessions} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeToggleChip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  activeToggleText: {
    color: colors.primary,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  deleteSessionButton: {
    alignItems: "center",
    borderColor: colors.danger,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  deleteSessionText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  editSessionButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  editSessionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  exerciseBlock: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  exerciseHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exercisePreview: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  exercisePreviewBody: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  exercisePreviewDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  exercisePreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  exercisePreviewLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  exercisePreviewTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  header: {
    gap: 4,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  quickActions: {
    gap: 10,
  },
  restState: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  restTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  removeExerciseButton: {
    alignItems: "center",
    backgroundColor: "#FEE4E2",
    borderRadius: 999,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  removeExerciseText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 15,
    minHeight: 54,
    justifyContent: "center",
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  savedMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  savedExerciseChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  section: {
    gap: 10,
  },
  selectedTypeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedTypeText: {
    color: colors.surface,
  },
  sessionDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sessionActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  sessionCopy: {
    flex: 1,
    gap: 4,
  },
  sessionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sessionList: {
    gap: 10,
  },
  sessionRow: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  sessionType: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  setBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    gap: 10,
    padding: 12,
  },
  setGrid: {
    gap: 10,
  },
  setTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  templateGrid: {
    gap: 8,
  },
  templateMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  templateName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  toggleChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  typeChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
