import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Card } from "./Card";
import { useMobileStorage } from "../storage/StorageProvider";
import type { ProgressPhoto } from "../storage/progressPhotos";
import { colors } from "../theme/colors";

function createPhoto(asset: ImagePicker.ImagePickerAsset): ProgressPhoto {
  return { id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, uri: asset.uri, createdAt: new Date().toISOString() };
}

export function ProgressPhotosCard() {
  const { loadProgressPhotos, saveProgressPhotos } = useMobileStorage();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { void loadProgressPhotos().then(setPhotos).catch(() => undefined); }, []);

  async function addPhoto() {
    setAdding(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photos unavailable", "Allow photo access in iPhone Settings to add a private progress photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const next = [createPhoto(result.assets[0]), ...photos].slice(0, 12);
      await saveProgressPhotos(next);
      setPhotos(next);
    } catch {
      Alert.alert("Photo not added", "Please try choosing the photo again.");
    } finally {
      setAdding(false);
    }
  }

  function removePhoto(photo: ProgressPhoto) {
    Alert.alert("Remove progress photo?", "This removes it from FitCheck Coach. The original stays in your photo library.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        const next = photos.filter((item) => item.id !== photo.id);
        void saveProgressPhotos(next).then(() => setPhotos(next));
      } },
    ]);
  }

  return <Card>
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>Progress photos</Text>
        <Text style={styles.body}>Private to this device. Photos are not uploaded with your account data.</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={adding} onPress={addPhoto} style={styles.addButton}>
        <Text style={styles.addText}>{adding ? "Adding..." : "Add photo"}</Text>
      </Pressable>
    </View>
    {photos.length ? <View style={styles.photoRow}>
      {photos.slice(0, 3).map((photo) => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel="Remove progress photo" onLongPress={() => removePhoto(photo)} style={styles.photoWrap}>
        <Image source={{ uri: photo.uri }} style={styles.photo} />
        <Text style={styles.photoDate}>{new Date(photo.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Text>
      </Pressable>)}
    </View> : <Text style={styles.empty}>Add a photo whenever it helps you see change beyond the scale.</Text>}
  </Card>;
}

const styles = StyleSheet.create({
  addButton: { alignItems: "center", borderColor: colors.primary, borderRadius: 12, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 11 },
  addText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  body: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  copy: { flex: 1, gap: 3 },
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  photo: { aspectRatio: 3 / 4, backgroundColor: colors.surfaceMuted, borderRadius: 8, width: "100%" },
  photoDate: { color: colors.textMuted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  photoRow: { flexDirection: "row", gap: 10 },
  photoWrap: { flex: 1, gap: 5 },
  title: { color: colors.text, fontSize: 17, fontWeight: "900" },
});
