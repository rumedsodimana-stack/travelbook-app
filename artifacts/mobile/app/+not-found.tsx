import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

export default function NotFoundScreen() {
  const { t } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={[styles.container, { backgroundColor: t.appBg }]}>
        <Text style={[TYPE.displayL, { color: t.ink }]}>
          This page is not in your book.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={[TYPE.body, { color: t.terra }]}>Back to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
