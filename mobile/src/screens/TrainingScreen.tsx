import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { TrainingAnalyticsCard } from "../components/TrainingAnalyticsCard";
import { useMobileStorage } from "../storage/StorageProvider";
import { SelectMenu } from "../components/SelectMenu";
import { Disclosure } from "../components/Disclosure";
import { WorkoutNameField } from "../components/WorkoutNameField";
import { loggedExercises } from "../utils/workoutSuggestions";
import { colors } from "../theme/colors";
import {
  ExerciseDraft,
  WorkoutDraft,
  WorkoutSession,
  WorkoutType,
} from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import {
  formatWeightFromLbs,
  getWeightUnitLabel,
  UnitSystem,
} from "../utils/units";
import {
  createBlankExercise,
  createBlankSet,
  createBlankWorkoutDraft,
  createWorkoutDraftFromSession,
  createWorkoutSessionFromDraft,
} from "../utils/workoutDraft";

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
      (exercise) =>
        normalizeExerciseName(exercise.name) === normalizedExerciseName,
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
  const {
    addWorkoutSession,
    deleteWorkoutSessionById,
    loadWorkoutSessions,
    loadUserSettings,
    upsertWorkoutSession,
  } = useMobileStorage();
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [draft, setDraft] = useState<WorkoutDraft>(() =>
    createBlankWorkoutDraft(),
  );
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(
    null,
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(true);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [savedExerciseIds, setSavedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const saveLock = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [historyMonth, setHistoryMonth] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refreshDate() {
      clearTimeout(timer);
      setTodayKey(getTodayKey());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refreshDate, midnight.getTime() - now.getTime() + 50);
    }
    refreshDate();
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") refreshDate();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);

  async function refreshSessions() {
    const [sessions, settings] = await Promise.all([
      loadWorkoutSessions(),
      loadUserSettings(),
    ]);
    setRecentSessions(
      sessions.slice().sort((a, b) => b.date.localeCompare(a.date)),
    );
    setUnitSystem(settings?.unitSystem ?? "imperial");
  }

  useEffect(() => {
    void refreshSessions().catch(() =>
      Alert.alert(
        "Workouts unavailable",
        "Reopen Training to load your saved workouts.",
      ),
    );
  }, []);

  function updateExercise(exerciseId: string, nextExercise: ExerciseDraft) {
    setActiveExerciseId(exerciseId);
    setSavedExerciseIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(exerciseId);
      return nextIds;
    });
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId ? nextExercise : exercise,
      ),
    }));
  }

  function addExercise() {
    const exercise = createBlankExercise();
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: [...currentDraft.exercises, exercise],
    }));
    setActiveExerciseId(exercise.id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
  }

  function addSavedExercise(
    savedExercise: Pick<ExerciseDraft, "name" | "muscleGroup">,
  ) {
    const exercise = {
      ...createBlankExercise(),
      name: savedExercise.name,
      muscleGroup: savedExercise.muscleGroup,
    };
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: [...currentDraft.exercises, exercise],
    }));
    setActiveExerciseId(exercise.id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
  }

  function removeExercise(exerciseId: string) {
    const remove = () => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        exercises: currentDraft.exercises.filter(
          (exercise) => exercise.id !== exerciseId,
        ),
      }));
      setSavedExerciseIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(exerciseId);
        return nextIds;
      });
      setActiveExerciseId(null);
    };
    const exercise = draft.exercises.find((item) => item.id === exerciseId);
    if (
      !exercise?.name.trim() &&
      !exercise?.sets.some((set) => set.reps || set.weightLbs)
    ) {
      remove();
      return;
    }
    Alert.alert(
      "Remove exercise?",
      "This removes the exercise from this draft. Save the workout to update its history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: remove },
      ],
    );
  }

  function selectWorkoutType(type: WorkoutType) {
    // Naming a workout must not discard exercises already entered.
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        type,
      };
    });
  }

  function editWorkout(session: WorkoutSession) {
    const nextDraft = createWorkoutDraftFromSession(session, unitSystem);
    setEditingSession(session);
    setDraft(nextDraft);
    setLastSavedAt(null);
    setSavedExerciseIds(new Set(nextDraft.exercises.map((exercise) => exercise.id)));
    setActiveExerciseId(null);
    setIsComposerOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function cancelEditWorkout() {
    setEditingSession(null);
    setDraft(createBlankWorkoutDraft());
    setLastSavedAt(null);
    setSavedExerciseIds(new Set());
    setActiveExerciseId(null);
    setIsComposerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function startWorkout() {
    setEditingSession(null);
    setDraft(createBlankWorkoutDraft());
    setLastSavedAt(null);
    setSavedExerciseIds(new Set());
    setActiveExerciseId(null);
    setIsComposerOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function saveExercise(exercise: ExerciseDraft) {
    if (!exercise.name.trim()) {
      Alert.alert(
        "Name this exercise",
        "Enter an exercise name before saving it in this workout.",
      );
      return;
    }
    const invalidSetIndex = exercise.sets.findIndex((set) => {
      const trimmedReps = set.reps.trim();
      const numericReps = Number(trimmedReps);
      const hasSetDetails = Boolean(
        set.weightLbs.trim() || set.isBodyweight || set.formFocus || set.notes.trim(),
      );
      return trimmedReps
        ? !Number.isInteger(numericReps) || numericReps <= 0
        : hasSetDetails;
    });
    if (invalidSetIndex >= 0) {
      Alert.alert(
        `Finish set ${invalidSetIndex + 1}`,
        "Enter a positive whole-number rep count, or remove the unfinished set.",
      );
      return;
    }
    const completedSets = exercise.sets.filter((set) => Number(set.reps) > 0);
    if (!completedSets.length) {
      Alert.alert(
        "Log a set",
        "Add reps for at least one set before saving this exercise.",
      );
      return;
    }
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((currentExercise) =>
        currentExercise.id === exercise.id
          ? { ...currentExercise, sets: completedSets }
          : currentExercise,
      ),
    }));
    setSavedExerciseIds((currentIds) => new Set(currentIds).add(exercise.id));
    setActiveExerciseId(null);
  }

  function editExercise(exerciseId: string) {
    setSavedExerciseIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(exerciseId);
      return nextIds;
    });
    setActiveExerciseId(exerciseId);
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
    if (saveLock.current) return;
    if (!draft.type.trim()) {
      Alert.alert("Name your workout", "Enter a workout name before saving.");
      return;
    }
    const isRest = draft.type.trim().toLowerCase() === "rest";
    if (isRest && draft.exercises.some((exercise) => exercise.name.trim())) {
      Alert.alert(
        "Exercises still in this draft",
        "Remove the exercises or choose a workout name before saving a rest day.",
      );
      return;
    }
    const unfinishedExercise = draft.exercises.find(
      (exercise) => exercise.name.trim() && !savedExerciseIds.has(exercise.id),
    );
    if (!isRest && unfinishedExercise) {
      Alert.alert(
        "Finish this exercise",
        `Save ${unfinishedExercise.name.trim()} before saving the workout.`,
      );
      return;
    }
    const draftedWorkoutSession = createWorkoutSessionFromDraft({
      date: editingSession?.date ?? getTodayKey(),
      draft: isRest ? { ...draft, type: "Rest", exercises: [] } : draft,
      unitSystem,
    });

    if (draftedWorkoutSession.exercises.length === 0 && !isRest) {
      Alert.alert(
        "Add an exercise",
        "Name at least one exercise before saving this workout.",
      );
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
    let sessions: WorkoutSession[];
    saveLock.current = true;
    setSaving(true);
    try {
      sessions = editingSession
        ? await upsertWorkoutSession(workoutSession, editingSession)
        : await addWorkoutSession(workoutSession);
    } catch (error) {
      Alert.alert(
        "Workout not saved",
        error instanceof Error
          ? error.message
          : "Please try again. Your draft was kept.",
      );
      return;
    } finally {
      saveLock.current = false;
      setSaving(false);
    }

    setRecentSessions(
      sessions.slice().sort((a, b) => b.date.localeCompare(a.date)),
    );
    setEditingSession(null);
    setDraft(createBlankWorkoutDraft());
    setLastSavedAt(
      new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    );
    setSavedExerciseIds(new Set());
    setActiveExerciseId(null);
    setIsComposerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    Alert.alert(
      editingSession ? "Workout updated" : "Workout saved",
      editingSession
        ? "Your saved workout was updated."
        : "Your workout was saved.",
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
            let sessions: WorkoutSession[];
            try {
              sessions = await deleteWorkoutSessionById(session.id, session);
            } catch (error) {
              Alert.alert(
                "Workout not deleted",
                error instanceof Error
                  ? error.message
                  : "Please reopen the record and try again.",
              );
              return;
            }
            setRecentSessions(
              sessions.slice().sort((a, b) => b.date.localeCompare(a.date)),
            );
            if (editingSession?.id === session.id) {
              setEditingSession(null);
              setDraft(createBlankWorkoutDraft());
              setSavedExerciseIds(new Set());
              setActiveExerciseId(null);
              setIsComposerOpen(false);
            }
            Alert.alert(
              "Workout deleted",
              "The workout was removed from your saved training history.",
            );
          },
        },
      ],
    );
  }

  const savedExercisesForWorkout = useMemo(
    () => loggedExercises(draft.type, recentSessions),
    [draft.type, recentSessions],
  );
  const availableSavedExercisesForWorkout = useMemo(() => {
    const completedNames = new Set(
      draft.exercises
        .filter((exercise) => savedExerciseIds.has(exercise.id))
        .map((exercise) => normalizeExerciseName(exercise.name)),
    );
    return savedExercisesForWorkout.filter(
      (exercise) => !completedNames.has(normalizeExerciseName(exercise.name)),
    );
  }, [draft.exercises, savedExerciseIds, savedExercisesForWorkout]);
  const isRestDay =
    draft.type.trim().toLowerCase() === "rest" &&
    !draft.exercises.some((exercise) => exercise.name.trim());
  const weightUnit = getWeightUnitLabel(unitSystem);
  const historyMonths = [
    ...new Set(recentSessions.map((session) => session.date.slice(0, 7))),
  ];
  const selectedMonth = historyMonths.includes(historyMonth)
    ? historyMonth
    : historyMonths[0];
  const visibleRecentSessions = recentSessions.filter((session) =>
    session.date.startsWith(selectedMonth ?? ""),
  );

  return (
    <Screen title="Training" scrollRef={scrollRef}>
      <View pointerEvents={saving ? "none" : "auto"}>
        {isComposerOpen ? (
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>
                {editingSession
                  ? formatReadableDate(editingSession.date)
                  : formatReadableDate(todayKey)}
              </Text>
              <Text style={styles.body}>
                {editingSession
                  ? `Editing saved ${editingSession.type} workout`
                  : "Workout session"}
              </Text>
            </View>

            <View style={styles.section}>
              <WorkoutNameField
                value={draft.type}
                onChange={selectWorkoutType}
                refreshKey={recentSessions}
              />
            </View>

            {isRestDay ? (
              <View style={styles.restState}>
                <Text style={styles.restTitle}>Rest day selected</Text>
                <Text style={styles.body}>
                  Save a rest day with notes for recovery, soreness, sleep, or
                  mobility. No exercises are needed.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.quickActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={addExercise}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Add exercise</Text>
                  </Pressable>
                </View>

                {availableSavedExercisesForWorkout.length ? (
                  <View style={styles.section}>
                    <Text style={styles.label}>
                      Previously logged for {draft.type}
                    </Text>
                    <SelectMenu
                      label="Choose a saved exercise"
                      options={availableSavedExercisesForWorkout.map((exercise) => ({
                        label: exercise.name,
                        value: exercise.name,
                      }))}
                      onChange={(name) => {
                        const exercise = availableSavedExercisesForWorkout.find(
                          (item) => item.name === name,
                        );
                        if (exercise) addSavedExercise(exercise);
                      }}
                    />
                  </View>
                ) : null}
              </>
            )}

            {!isRestDay &&
              draft.exercises.map((exercise, exerciseIndex) => {
                const exercisePreview = getLastExercisePerformance(
                  exercise.name,
                  draft.type,
                  recentSessions,
                  unitSystem,
                );
                const isSavedExercise = savedExerciseIds.has(exercise.id);
                const isExpanded =
                  !isSavedExercise || activeExerciseId === exercise.id;

                return (
                  <View
                    key={exercise.id}
                    style={
                      isSavedExercise && !isExpanded
                        ? styles.savedExerciseBlock
                        : styles.exerciseBlock
                    }
                  >
                    {isSavedExercise && !isExpanded ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => editExercise(exercise.id)}
                        style={styles.savedExerciseSummary}
                      >
                        <View style={styles.savedExerciseCopy}>
                          <Text style={styles.savedExerciseTitle}>
                            {exercise.name}
                          </Text>
                          <Text style={styles.savedExerciseMeta}>
                            Logged - {exercise.sets.length}{" "}
                            {exercise.sets.length === 1 ? "set" : "sets"}
                          </Text>
                        </View>
                        <Text style={styles.savedExerciseEdit}>Edit</Text>
                      </Pressable>
                    ) : (
                      <>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseTitle}>
                            Exercise {exerciseIndex + 1}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => removeExercise(exercise.id)}
                            style={styles.removeExerciseButton}
                          >
                            <Text style={styles.removeExerciseText}>
                              Delete
                            </Text>
                          </Pressable>
                        </View>

                        <TextField
                          label="Exercise name"
                          onChangeText={(value) =>
                            updateExercise(exercise.id, {
                              ...exercise,
                              name: value,
                            })
                          }
                          placeholder="Bench press, pull-up, squat"
                          value={exercise.name}
                        />
                        <Disclosure
                          title={
                            exercise.muscleGroup
                              ? `Muscle group: ${exercise.muscleGroup}`
                              : "Muscle group (optional)"
                          }
                          initiallyOpen={Boolean(exercise.muscleGroup)}
                        >
                          <TextField
                            label="Muscle group"
                            onChangeText={(value) =>
                              updateExercise(exercise.id, {
                                ...exercise,
                                muscleGroup: value,
                              })
                            }
                            placeholder="Chest, back, legs"
                            value={exercise.muscleGroup}
                          />
                        </Disclosure>

                        {exercisePreview ? (
                          <View style={styles.exercisePreview}>
                            <View style={styles.exercisePreviewHeader}>
                              <Text style={styles.exercisePreviewLabel}>
                                Last performance
                              </Text>
                              <Text style={styles.exercisePreviewDate}>
                                {exercisePreview.dateLabel}
                              </Text>
                            </View>
                            <Text style={styles.exercisePreviewTitle}>
                              {exercisePreview.muscleGroup}
                            </Text>
                            <Text style={styles.exercisePreviewBody}>
                              {exercisePreview.setSummary}
                            </Text>
                          </View>
                        ) : null}

                        {exercise.sets.map((set, setIndex) => (
                          <View key={set.id} style={styles.setBlock}>
                            <View style={styles.exerciseHeader}>
                              <Text style={styles.setTitle}>
                                Set {setIndex + 1}
                              </Text>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Remove set ${setIndex + 1}`}
                                style={styles.removeExerciseButton}
                                onPress={() =>
                                  updateExercise(exercise.id, {
                                    ...exercise,
                                    sets: exercise.sets.filter(
                                      (item) => item.id !== set.id,
                                    ),
                                  })
                                }
                              >
                                <Text style={styles.removeExerciseText}>
                                  Remove
                                </Text>
                              </Pressable>
                            </View>
                            <View style={styles.setGrid}>
                              <TextField
                                keyboardType="number-pad"
                                label="Reps"
                                onChangeText={(value) =>
                                  updateExercise(exercise.id, {
                                    ...exercise,
                                    sets: exercise.sets.map((currentSet) =>
                                      currentSet.id === set.id
                                        ? { ...currentSet, reps: value }
                                        : currentSet,
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
                                placeholder={
                                  set.isBodyweight ? "bodyweight" : weightUnit
                                }
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
                                            isBodyweight:
                                              !currentSet.isBodyweight,
                                            weightLbs: "",
                                          }
                                        : currentSet,
                                    ),
                                  })
                                }
                                style={[
                                  styles.toggleChip,
                                  set.isBodyweight && styles.activeToggleChip,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.toggleText,
                                    set.isBodyweight && styles.activeToggleText,
                                  ]}
                                >
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
                                        ? {
                                            ...currentSet,
                                            formFocus: !currentSet.formFocus,
                                          }
                                        : currentSet,
                                    ),
                                  })
                                }
                                style={[
                                  styles.toggleChip,
                                  set.formFocus && styles.activeToggleChip,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.toggleText,
                                    set.formFocus && styles.activeToggleText,
                                  ]}
                                >
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
                          <Text style={styles.secondaryButtonText}>
                            Add set
                          </Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => saveExercise(exercise)}
                          style={styles.exerciseSaveButton}
                        >
                          <Text style={styles.exerciseSaveText}>
                            Save exercise
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                );
              })}

            <Disclosure
              title={
                draft.notes ? "Workout notes (added)" : "Add workout notes"
              }
            >
              <TextField
                label="Workout notes"
                multiline
                onChangeText={(value) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    notes: value,
                  }))
                }
                placeholder="Energy, soreness, pump, mind-muscle connection"
                style={styles.notesInput}
                value={draft.notes}
              />
            </Disclosure>

            <Pressable
              accessibilityRole="button"
              onPress={saveWorkout}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : editingSession
                    ? "Update Workout"
                    : "Save Workout"}
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

            {lastSavedAt ? (
              <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text>
            ) : null}
          </Card>
        ) : (
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>Training</Text>
              <Text style={styles.body}>
                Log a workout one exercise at a time. Completed exercises stay
                visible but collapse out of your way.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={startWorkout}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Start workout</Text>
            </Pressable>
            {lastSavedAt ? (
              <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text>
            ) : null}
          </Card>
        )}

        <Card>
          <Disclosure title={`Saved workouts (${recentSessions.length})`}>
            {historyMonths.length > 0 && (
              <SelectMenu
                label="Month"
                value={selectedMonth}
                options={historyMonths.map((month) => ({
                  value: month,
                  label: new Date(`${month}-01T12:00:00`).toLocaleDateString(
                    undefined,
                    { month: "long", year: "numeric" },
                  ),
                }))}
                onChange={setHistoryMonth}
              />
            )}
            {visibleRecentSessions.length === 0 ? (
              <Text style={styles.body}>No workouts saved yet.</Text>
            ) : (
              <View style={styles.sessionList}>
                {visibleRecentSessions.map((session) => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionCopy}>
                        <Text style={styles.sessionDate}>
                          {formatReadableDate(session.date)}
                        </Text>
                        <Text style={styles.body}>
                          {session.exercises.length}{" "}
                          {session.exercises.length === 1
                            ? "exercise"
                            : "exercises"}
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
          </Disclosure>
        </Card>
      </View>

      <TrainingAnalyticsCard
        sessions={recentSessions}
        unitSystem={unitSystem}
      />
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
    minHeight: 44,
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
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  editSessionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  savedExerciseBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  savedExerciseSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  savedExerciseCopy: {
    flex: 1,
    gap: 4,
  },
  savedExerciseTitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "800",
  },
  savedExerciseMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  savedExerciseEdit: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  exerciseSaveButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  exerciseSaveText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  exerciseBlock: {
    borderColor: colors.border,
    borderTopWidth: 1,
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
    minHeight: 44,
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
    maxWidth: "45%",
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
    borderBottomWidth: 1,
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
