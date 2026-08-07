import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { addWorkoutSession, loadRecentWorkoutSessions } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { ExerciseDraft, WorkoutDraft, WorkoutSession, WorkoutType } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import {
  createBlankExercise,
  createBlankSet,
  createBlankWorkoutDraft,
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

export function TrainingScreen() {
  const todayKey = useMemo(() => getTodayKey(), []);
  const [draft, setDraft] = useState<WorkoutDraft>(() => createBlankWorkoutDraft());
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  async function refreshSessions() {
    const sessions = await loadRecentWorkoutSessions(5);
    setRecentSessions(sessions);
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
    const workoutSession = createWorkoutSessionFromDraft({
      date: todayKey,
      draft,
    });

    if (workoutSession.exercises.length === 0 && draft.type !== "Rest") {
      Alert.alert("Add an exercise", "Name at least one exercise before saving this workout.");
      return;
    }

    const sessions = await addWorkoutSession(workoutSession);
    setRecentSessions(sessions.slice(0, 5));
    setDraft(createBlankWorkoutDraft(draft.type));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Workout saved", "Your workout was saved on this device.");
  }

  return (
    <Screen
      title="Training"
      subtitle="Log exercises, sets, reps, weight, bodyweight work, and form-focus notes."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{formatReadableDate(todayKey)}</Text>
          <Text style={styles.body}>Workout session</Text>
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
                  onPress={() => setDraft((currentDraft) => ({ ...currentDraft, type }))}
                  style={[styles.typeChip, isSelected && styles.selectedTypeChip]}
                >
                  <Text style={[styles.typeText, isSelected && styles.selectedTypeText]}>{type}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {draft.exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseTitle}>Exercise {exerciseIndex + 1}</Text>
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
                    placeholder={set.isBodyweight ? "bodyweight" : "lbs"}
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
        ))}

        <Pressable accessibilityRole="button" onPress={addExercise} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add Exercise</Text>
        </Pressable>

        <TextField
          label="Workout notes"
          multiline
          onChangeText={(value) => setDraft((currentDraft) => ({ ...currentDraft, notes: value }))}
          placeholder="Energy, soreness, pump, mind-muscle connection"
          style={styles.notesInput}
          value={draft.notes}
        />

        <Pressable accessibilityRole="button" onPress={saveWorkout} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </Pressable>

        {lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.title}>Recent Workouts</Text>
        {recentSessions.length === 0 ? (
          <Text style={styles.body}>No workouts saved yet.</Text>
        ) : (
          <View style={styles.sessionList}>
            {recentSessions.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionDate}>{formatReadableDate(session.date)}</Text>
                  <Text style={styles.sessionType}>{session.type}</Text>
                </View>
                <Text style={styles.body}>
                  {session.exercises.length} {session.exercises.length === 1 ? "exercise" : "exercises"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
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
  sessionHeader: {
    alignItems: "center",
    flexDirection: "row",
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
