import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { DailyCoachBriefCard } from "../components/DailyCoachBriefCard";
import { LogEditorCard } from "../components/LogEditorCard";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import { useMobileStorage } from "../storage/StorageProvider";
import { colors } from "../theme/colors";
import { DailyLog, TodayLogDraft, UserSettings, WorkoutSession } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";
import { calculateProgressInsights } from "../utils/progressInsights";
import { getWeightUnitLabel } from "../utils/units";

export function TodayScreen() {
  const { getDailyLogByDate, loadDailyLogsDescending, loadRecentWorkoutSessions,
    loadUserSettings, upsertDailyLog } = useMobileStorage();
  const [draft, setDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [existingLog, setExistingLog] = useState<DailyLog | undefined>();
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLog() {
      try {
        const [savedTodayLog, savedLogs, savedSettings, savedWorkouts] = await Promise.all([
          getDailyLogByDate(todayKey),
          loadDailyLogsDescending(),
          loadUserSettings(),
          loadRecentWorkoutSessions(30),
        ]);

        if (!isMounted) {
          return;
        }

        setExistingLog(savedTodayLog);
        setAllLogs(savedLogs);
        setSettings(savedSettings);
        setRecentWorkouts(savedWorkouts);
        const unitSystem = savedSettings?.unitSystem ?? "imperial";
        setDraft(
          savedTodayLog
            ? dailyLogToDraft(savedTodayLog, unitSystem)
            : { ...dailyLogToDraft(undefined, unitSystem), goal: savedSettings?.defaultGoal ?? "maintain" },
        );
        setRecentLogs(savedLogs.slice(0, 5));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedLog();

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  async function saveLog() {
    const dailyLog = createDailyLogFromDraft({
      date: todayKey,
      draft,
      existingLog,
      unitSystem: settings?.unitSystem ?? "imperial",
    });

    let updatedLogs: DailyLog[];
    try { updatedLogs = await upsertDailyLog(dailyLog, existingLog ?? null); }
    catch (error) { Alert.alert("Log not saved", error instanceof Error ? error.message : "Please try again. Your draft was kept."); return; }
    const sortedLogs = updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
    setExistingLog(dailyLog);
    setAllLogs(sortedLogs);
    setRecentLogs(sortedLogs.slice(0, 5));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Log saved", "Your daily log was saved on this device.");
  }

  const coachSettings: UserSettings = {
    unitSystem: settings?.unitSystem ?? "imperial",
    defaultGoal: draft.goal,
    startingWeightLbs: settings?.startingWeightLbs,
    targetWeightLbs: settings?.targetWeightLbs,
    weeklyGoalPaceLbs: settings?.weeklyGoalPaceLbs,
    calorieTarget: settings?.calorieTarget,
    proteinTarget: settings?.proteinTarget,
    stepTarget: settings?.stepTarget,
    hasCompletedOnboarding: settings?.hasCompletedOnboarding,
    updatedAt: settings?.updatedAt,
  };
  const coachInsights = calculateProgressInsights(allLogs, coachSettings);
  const unitSystem = settings?.unitSystem ?? "imperial";
  const weightUnit = getWeightUnitLabel(unitSystem);
  const workoutPerformancePreview = useMemo(
    () => buildWorkoutPerformancePreview(draft.workoutType, recentWorkouts),
    [draft.workoutType, recentWorkouts],
  );

  return (
    <Screen
      title="Today"
      subtitle="Log what you know. Blank fields stay blank and will not count against your trends."
    >
      <DailyCoachBriefCard insights={coachInsights} unitSystem={unitSystem} />

      <LogEditorCard
        dateLabel={formatReadableDate(todayKey)}
        draft={draft}
        workoutPerformancePreview={workoutPerformancePreview}
        onDraftChange={setDraft}
        onSubmit={saveLog}
        weightUnit={weightUnit}
        statusLabel={
          isLoading
            ? "Loading saved log"
            : existingLog
              ? "Editing saved daily log"
              : "New daily check-in"
        }
        submitLabel={existingLog ? "Update Today" : "Save Today"}
        footer={
          lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null
        }
      />

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Logs</Text>
          <Text style={styles.cardMeta}>Last 5 saved days on this device</Text>
        </View>
        <RecentLogsList logs={recentLogs} unitSystem={unitSystem} />
      </Card>
    </Screen>
  );
}

function buildWorkoutPerformancePreview(
  workoutType: TodayLogDraft["workoutType"],
  workouts: WorkoutSession[],
) {
  if (workoutType === "Rest") {
    return null;
  }

  const matchingWorkouts = workouts.filter(
    (workout) => workout.type === workoutType && workout.exercises.length > 0,
  );
  const latestWorkout = matchingWorkouts[0];

  if (!latestWorkout) {
    return null;
  }

  const totalOutput = latestWorkout.exercises.reduce(
    (workoutTotal, exercise) =>
      workoutTotal +
      exercise.sets.reduce(
        (exerciseTotal, set) =>
          exerciseTotal + (set.reps ?? 0) * (set.isBodyweight ? 1 : set.weightLbs ?? 0),
        0,
      ),
    0,
  );

  return {
    dateLabel: formatReadableDate(latestWorkout.date),
    workoutType,
    sessions: matchingWorkouts.length,
    totalOutput,
    exercises: latestWorkout.exercises.map((exercise) => {
      const setSummary = exercise.sets
        .map((set) => {
          const reps = set.reps ?? 0;
          const load = set.isBodyweight
            ? "bodyweight"
            : typeof set.weightLbs === "number"
              ? `${set.weightLbs} lb`
              : "no load";

          return `${reps} reps @ ${load}`;
        })
        .join(", ");

      return `${exercise.name}: ${setSummary}`;
    }),
  };
}

const styles = StyleSheet.create({
  cardHeader: {
    gap: 4,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  savedMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
