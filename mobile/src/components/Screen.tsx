import React from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Which edges to inset. Native only — ignored on web because desktop
   * browsers have no notch and `react-native-safe-area-context`'s
   * `SafeAreaView` re-render + padding-shape on web triggers flex/overflow
   * issues with `react-navigation` scenes (see commit history). Mobile-web
   * notches, if needed later, are best handled via CSS `env(safe-area-inset-*)`.
   */
  edges?: readonly Edge[];
};

export function Screen({ children, style, edges = ["top"] }: Props) {
  if (Platform.OS === "web") {
    return <View style={style}>{children}</View>;
  }
  return (
    <SafeAreaView style={style} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

// Drop-in replacement for `SafeAreaView` from `react-native-safe-area-context`
// in screen-level usage. Same import shape, web-safe.
export { Screen as SafeAreaView };
