import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { CURRICULUM, getMap, horseSpeed, type Facing } from '@kotodama/core';
import { WorldCanvas } from '../overworld/WorldCanvas';
import { DPad, RoundButton, useHeldDirection } from '../input/DPad';
import { DialogueBox } from '../ui/DialogueBox';
import { GameMenu } from '../ui/GameMenu';
import { PText } from '../ui/Pixel';
import { useGame, useGameApi } from '../state/context';
import { C } from '../theme';

const WALK_MS = 190;

export function WorldScreen({ onExit }: { onExit?: () => void }) {
  const api = useGameApi();
  const save = useGame((s) => s.save);
  const stepId = useGame((s) => s.stepId);
  const dialogue = useGame((s) => s.dialogue);
  const banner = useGame((s) => s.banner);
  const toast = useGame((s) => s.toast);
  const { width, height } = useWindowDimensions();
  const [menu, setMenu] = useState(false);

  const riding = !!save?.horse.riding;
  const stepMs = riding ? Math.round(WALK_MS / horseSpeed(save?.streakDays ?? 1)) : WALK_MS;

  const { start, stop } = useHeldDirection(
    (d: Facing) => {
      if (menu) return;
      api.getState().tryStep(d);
    },
    stepMs,
    () => !menu && api.getState().interact(),
    () => setMenu((m) => !m),
  );

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => api.getState().clearBanner(), 2200);
    return () => clearTimeout(t);
  }, [banner, api]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => api.getState().clearToast(), 2000);
    return () => clearTimeout(t);
  }, [toast, api]);
  // Stop walking the moment a dialogue or battle takes over.
  useEffect(() => {
    if (dialogue) stop();
  }, [dialogue, stop]);

  if (!save) return null;
  const area = CURRICULUM[getMap(save.mapId).def.area];

  return (
    <View style={styles.root}>
      <WorldCanvas save={save} stepId={stepId} stepMs={stepMs} width={width} height={height} />

      <SafeAreaView style={styles.hud} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.chip}>
            <PText style={styles.chipText}>Lv {save.heroLevel}</PText>
            <PText style={[styles.chipText, { color: C.gold }]}>🔥{save.streakDays}</PText>
          </View>
          <RoundButton label="≡" sub="menu" size={46} color={C.panelEdge} onPress={() => setMenu(true)} />
        </View>

        {banner ? (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(400)} style={styles.banner} pointerEvents="none">
            <PText ja style={styles.bannerJa}>{banner.nameJa}</PText>
            <PText style={styles.bannerName}>{banner.name.toUpperCase()}</PText>
            {area ? <PText style={styles.bannerArea}>Kana: {area.label}</PText> : null}
          </Animated.View>
        ) : null}
        {toast ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.toast} pointerEvents="none">
            <PText style={styles.toastText}>{toast}</PText>
          </Animated.View>
        ) : null}

        {!dialogue && !menu ? (
          <View style={styles.controls} pointerEvents="box-none">
            <DPad start={start} stop={stop} />
            <View style={styles.buttons}>
              {save.horse.owned ? (
                <RoundButton label="🐎" sub={riding ? 'dismount' : 'ride'} size={52} color={riding ? C.gold : '#6B4A2E'} onPress={() => api.getState().toggleRide()} />
              ) : null}
              <RoundButton label="A" sub="talk" size={70} color={C.red} onPress={() => api.getState().interact()} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      {dialogue ? <DialogueBox dialogue={dialogue} onAdvance={() => api.getState().advanceDialogue()} /> : null}
      {menu ? (
        <GameMenu
          save={save}
          onClose={() => setMenu(false)}
          onSave={() => {
            void api.getState().persist();
            api.setState({ toast: 'Saved.' });
            setMenu(false);
          }}
          onTitle={() => {
            void api.getState().persist();
            api.getState().flushSession();
            setMenu(false);
            api.setState({ screen: 'title', hasSave: true });
          }}
          onExit={onExit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  hud: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  chip: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16,14,28,0.85)',
    borderColor: C.panelEdge,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: { fontSize: 9 },
  banner: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16,14,28,0.88)',
    borderColor: C.gold,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bannerJa: { fontSize: 22, lineHeight: 28, color: C.gold },
  bannerName: { fontSize: 10, marginTop: 4 },
  bannerArea: { fontSize: 7, color: C.sakura, marginTop: 6 },
  toast: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(16,14,28,0.92)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 2,
    borderColor: C.jade,
  },
  toastText: { fontSize: 8, color: C.paper },
  controls: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  buttons: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingBottom: 30 },
});
