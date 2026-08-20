import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ProgressInsights } from "../utils/progressInsights";
import { convertWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { Card } from "./Card";

type DailyCoachBriefCardProps = {
  insights: ProgressInsights;
  unitSystem?: UnitSystem;
};

function formatTrend(insights: ProgressInsights, unitSystem: UnitSystem): string {
  const weeklyChange = insights.weightTrend.weeklyChange;
  if (typeof weeklyChange !== "number") {
    return "Need more weigh-ins";
  }

  const convertedChange = Math.round(convertWeightFromLbs(weeklyChange, unitSystem) * 10) / 10;
  return `${convertedChange} ${getWeightUnitLabel(unitSystem)}/week`;
}

function formatQualityLabel(status: ProgressInsights["loggingQuality"]["status"]): string {
  if (status === "strong") {
    return "Strong data";
  }

  if (status === "usable") {
    return "Usable data";
  }

  if (status === "thin") {
    return "Thin data";
  }

  return "Build baseline";
}

function getReviewTone(mode: ProgressInsights["coachReview"]["mode"]) {
  if (mode === "Adjust plan") {
    return {
      box: styles.reviewBoxWarning,
      label: styles.reviewLabelWarning,
    };
  }

  if (mode === "Hold plan") {
    return {
      box: styles.reviewBoxSuccess,
      label: styles.reviewLabelSuccess,
    };
  }

  return {
    box: styles.reviewBoxNeutral,
    label: styles.reviewLabelNeutral,
  };
}

export function DailyCoachBriefCard({
  insights,
  unitSystem = "imperial",
}: DailyCoachBriefCardProps) {
  const reviewTone = getReviewTone(insights.coachReview.mode);

  return (
    <Card>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Today's Coach Brief</Text>
          <Text style={styles.title}>{insights.priority}</Text>
        </View>
        <View style={styles.goalPill}>
          <Text style={styles.goalText}>{insights.activeGoal}</Text>
        </View>
      </View>

      <Text style={styles.body}>{insights.nextAction}</Text>

      <View style={styles.signalRow}>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Trend</Text>
          <Text style={styles.signalValue}>{formatTrend(insights, unitSystem)}</Text>
          <Text style={styles.signalMeta}>{insights.weightTrend.status}</Text>
        </View>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Quality</Text>
          <Text style={styles.signalValue}>{insights.loggingQuality.score}/100</Text>
          <Text style={styles.signalMeta}>{formatQualityLabel(insights.loggingQuality.status)}</Text>
        </View>
      </View>

      <View style={styles.nextBox}>
        <Text style={styles.nextLabel}>Plan Guardrail</Text>
        <Text style={styles.nextText}>{insights.loggingQuality.nextAction}</Text>
      </View>

      <View style={[styles.reviewBox, reviewTone.box]}>
        <View style={styles.reviewHeader}>
          <Text style={[styles.reviewLabel, reviewTone.label]}>
            {insights.coachReview.mode}
          </Text>
          <Text style={styles.reviewConfidence}>
            {insights.coachReview.confidence} confidence
          </Text>
        </View>
        <Text style={styles.reviewTitle}>{insights.coachReview.reviewWindow}</Text>
        <Text style={styles.reviewBody}>{insights.coachReview.rule}</Text>
        <Text style={styles.reviewReason}>{insights.coachReview.reason}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 4,
    width: 54,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  goalPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  nextBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    gap: 4,
    padding: 12,
  },
  nextLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  reviewBody: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  reviewBox: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 13,
  },
  reviewBoxNeutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  reviewBoxSuccess: {
    backgroundColor: "#EAF7F1",
    borderColor: "#BFE8D5",
  },
  reviewBoxWarning: {
    backgroundColor: "#FFF5E8",
    borderColor: "#F4D3A6",
  },
  reviewConfidence: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reviewLabelNeutral: {
    color: colors.primary,
  },
  reviewLabelSuccess: {
    color: colors.success,
  },
  reviewLabelWarning: {
    color: colors.warning,
  },
  reviewReason: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  signalBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    flex: 1,
    gap: 3,
    padding: 12,
  },
  signalLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  signalMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  signalRow: {
    flexDirection: "row",
    gap: 10,
  },
  signalValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
});
