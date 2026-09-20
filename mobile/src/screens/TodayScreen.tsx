import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, Text, View } from "react-native";
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
import { formatWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";

export function TodayScreen({ onStartWorkout }: { onStartWorkout?: () => void }) {
  const [date, setDate] = useState(() => getTodayKey());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refreshDate() {
      clearTimeout(timer);
      setDate(getTodayKey());
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
  return <TodayLogScreen key={date} todayKey={date} onStartWorkout={onStartWorkout} />;
}

function TodayLogScreen({todayKey, onStartWorkout}: {todayKey: string; onStartWorkout?: () => void}) {
  const { getDailyLogByDate, loadDailyLogsDescending, loadRecentWorkoutSessions,
    loadTodayLogDraft, loadUserSettings, saveTodayLogDraft, clearTodayLogDraft, upsertDailyLog } = useMobileStorage();
  const [draft, setDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [existingLog, setExistingLog] = useState<DailyLog | undefined>();
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLog() {
      try {
        const [savedTodayLog, savedLogs, savedSettings, savedWorkouts, savedDraft] = await Promise.all([
          getDailyLogByDate(todayKey),
          loadDailyLogsDescending(),
          loadUserSettings(),
          loadRecentWorkoutSessions(30),
          loadTodayLogDraft(todayKey),
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
          savedDraft
            ? savedDraft
            : savedTodayLog
              ? dailyLogToDraft(savedTodayLog, unitSystem)
            : { ...dailyLogToDraft(undefined, unitSystem), goal: savedSettings?.defaultGoal ?? "maintain" },
        );
        setRecentLogs(savedLogs.slice(0, 5));
      } catch {
        if (isMounted) {
          setLoadError(true);
          Alert.alert("Log unavailable", "Reopen Today to load your saved log before editing.");
        }
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

  function updateDraft(nextDraft: TodayLogDraft) {
    if (isLoading || loadError || saveLock.current) return;
    setDraft(nextDraft);
    if (!isLoading) {
      void saveTodayLogDraft(todayKey, nextDraft).catch(() => {
        Alert.alert("Draft not saved", "Save today's log before closing the app.");
      });
    }
  }

  async function saveLog() {
    if (isLoading || loadError || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      const dailyLog = createDailyLogFromDraft({
        date: todayKey,
        draft,
        existingLog,
        unitSystem: settings?.unitSystem ?? "imperial",
      });

      let updatedLogs: DailyLog[];
      try { updatedLogs = await upsertDailyLog(dailyLog, existingLog ?? null); }
      catch (error) { Alert.alert("Log not saved", error instanceof Error ? error.message : "Please try again. Your draft was kept."); return; }
      if (getTodayKey() === todayKey) {
        try { await clearTodayLogDraft(); }
        catch { Alert.alert("Log saved", "Draft cleanup failed. Check the values when reopening Today."); }
      }
      const sortedLogs = updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
      setExistingLog(dailyLog);
      setDraft(dailyLogToDraft(dailyLog, settings?.unitSystem ?? "imperial"));
      setAllLogs(sortedLogs);
      setRecentLogs(sortedLogs.slice(0, 5));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
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
  const hasUnsavedChanges = existingLog
    ? JSON.stringify(draft) !== JSON.stringify(dailyLogToDraft(existingLog, unitSystem))
    : false;
  const savedTime = lastSavedAt ?? (existingLog
    ? new Date(existingLog.updatedAt).toLocaleTimeString([], {hour: "numeric", minute: "2-digit"})
    : null);
  const workoutPerformancePreview = useMemo(
    () => buildWorkoutPerformancePreview(draft.workoutType, recentWorkouts, unitSystem),
    [draft.workoutType, recentWorkouts, unitSystem],
  );

  return (
    <Screen
      title="Today"
    >
      <View pointerEvents={isLoading || loadError || saving ? "none" : "auto"}>
      <LogEditorCard
        dateLabel={formatReadableDate(todayKey)}
        draft={draft}
        workoutPerformancePreview={workoutPerformancePreview}
        onDraftChange={updateDraft}
        onStartWorkout={onStartWorkout}
        onSubmit={saveLog}
        weightUnit={weightUnit}
        statusLabel={
          isLoading
            ? "Loading today"
            : loadError
              ? "Unable to load"
            : saving
              ? "Saving"
            : hasUnsavedChanges
              ? "Unsaved changes"
            : existingLog
              ? "Saved for today"
              : "New daily check-in"
        }
        submitLabel={saving ? "Saving..." : existingLog ? "Update Today" : "Save Today"}
        footer={
          existingLog && savedTime ? <Text accessibilityLiveRegion="polite" style={styles.savedMeta}>Saved at {savedTime}</Text> : null
        }
      />
      </View>

      <DailyCoachBriefCard insights={coachInsights} unitSystem={unitSystem} />

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Logs</Text>
          <Text style={styles.cardMeta}>Last 5 saved days</Text>
        </View>
        <RecentLogsList logs={recentLogs} unitSystem={unitSystem} />
      </Card>
    </Screen>
  );
}

function buildWorkoutPerformancePreview(
  workoutType: TodayLogDraft["workoutType"],
  workouts: WorkoutSession[],
  unitSystem: UnitSystem,
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
              ? `${formatWeightFromLbs(set.weightLbs, unitSystem)} ${getWeightUnitLabel(unitSystem)}`
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
