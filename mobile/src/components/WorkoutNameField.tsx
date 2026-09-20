import {useEffect, useState} from "react";
import {View} from "react-native";
import {useMobileStorage} from "../storage/StorageProvider";
import {loggedWorkoutNames} from "../utils/workoutSuggestions";
import {SelectMenu} from "./SelectMenu";
import {TextField} from "./TextField";

export function WorkoutNameField({value, onChange, refreshKey}: {
  value: string; onChange: (name: string) => void; refreshKey?: unknown;
}) {
  const storage = useMobileStorage();
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([storage.loadDailyLogsDescending(), storage.loadWorkoutSessions()])
      .then(([logs, sessions]) => {if (active) setNames(loggedWorkoutNames(logs, sessions));})
      .catch(() => {if (active) setNames([]);});
    return () => {active = false;};
  }, [storage, refreshKey]);
  return <View style={{gap: 10}}>
    {names.length > 0 && <SelectMenu label="Previously logged workouts" value={value}
      options={names.map(name => ({label: name, value: name}))} onChange={onChange} />}
    <TextField label="Workout name" placeholder="Enter a workout or Rest" value={value} onChangeText={onChange} />
  </View>;
}
