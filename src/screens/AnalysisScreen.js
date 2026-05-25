import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { getAnalysis } from '../services/api';

const SCREEN_W = Dimensions.get('window').width;
const DAY_W    = 52;   // pixels per day on the graph
const G_H      = 180;  // graph height
const PAD      = { top: 16, bottom: 28, left: 38, right: 16 };

// ---- Line graph (pure React Native, no SVG library needed) ----

function LineGraph({ data }) {
  if (!data || data.length === 0) {
    return (
      <View style={graph.empty}>
        <Text style={graph.emptyText}>No data yet — start logging practice sessions!</Text>
      </View>
    );
  }

  const maxHours = Math.max(...data.map(d => d.hours), 2);
  const plotW    = Math.max(data.length * DAY_W, SCREEN_W - 40);
  const plotH    = G_H - PAD.top - PAD.bottom;

  const getX = i  => PAD.left + (i / Math.max(data.length - 1, 1)) * (plotW - PAD.left - PAD.right);
  const getY = h  => PAD.top  + plotH - (h / maxHours) * plotH;

  // Build line segments between consecutive points
  const segments = [];
  for (let i = 0; i < data.length - 1; i++) {
    const x1 = getX(i),  y1 = getY(data[i].hours);
    const x2 = getX(i+1), y2 = getY(data[i+1].hours);
    const len   = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
    segments.push({ key: `seg-${i}`, mx: (x1+x2)/2, my: (y1+y2)/2, len, angle });
  }

  // Y-axis gridlines at 0, half, max
  const yTicks = [0, Math.round(maxHours / 2 * 2) / 2, maxHours];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: plotW, height: G_H }}>

        {/* Gridlines + Y labels */}
        {yTicks.map(h => (
          <View key={`grid-${h}`}>
            <View style={[graph.gridLine, { top: getY(h), left: PAD.left, width: plotW - PAD.left - PAD.right }]} />
            <Text style={[graph.yLabel, { top: getY(h) - 8 }]}>{h}h</Text>
          </View>
        ))}

        {/* Line segments */}
        {segments.map(s => (
          <View
            key={s.key}
            style={[graph.segment, {
              left: s.mx - s.len / 2,
              top:  s.my - 1,
              width: s.len,
              transform: [{ rotate: `${s.angle}deg` }],
            }]}
          />
        ))}

        {/* Data points */}
        {data.map((d, i) => (
          <View
            key={d.date}
            style={[
              graph.dot,
              { left: getX(i) - 6, top: getY(d.hours) - 6 },
              d.hasTournament ? graph.dotTournament : graph.dotNormal,
            ]}
          />
        ))}

        {/* X-axis date labels */}
        {data.map((d, i) => (
          <Text
            key={`xl-${d.date}`}
            style={[graph.xLabel, { left: getX(i) - 18, top: G_H - PAD.bottom + 4 }]}
          >
            {d.date.slice(5).replace('-', '/')}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

// ---- Legend ----

function Legend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#2E7D32' }]} />
        <Text style={styles.legendText}>Regular practice</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#E65100' }]} />
        <Text style={styles.legendText}>Tournament day</Text>
      </View>
    </View>
  );
}

// ---- Main screen ----

export default function AnalysisScreen({ route }) {
  const user = route.params?.user;
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAnalysis({ name: user.name });
        if (result.success) setData(result);
        else setError(result.message || 'Could not load analysis.');
      } catch {
        setError('Connection error. Check your internet and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading your stats…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const { percentile, weeklyHours, memberDailyData } = data;

  const percentileMsg = () => {
    if (weeklyHours === 0) return "You haven't logged any practice hours this week yet.";
    if (percentile >= 100) return "You've practiced more than everyone else on the team this week!";
    if (percentile === 0)  return "You're at the bottom of the team this week — time to push harder!";
    return `You've practiced more than ${percentile}% of the team this week!`;
  };

  const weeklyLabel = weeklyHours === 1 ? '1 hr' : `${weeklyHours} hrs`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Percentile card */}
      <View style={styles.rankCard}>
        <Text style={styles.rankMsg}>{percentileMsg()}</Text>
        <View style={styles.weeklyRow}>
          <Text style={styles.weeklyLabel}>Your hours this week</Text>
          <Text style={styles.weeklyHours}>{weeklyLabel}</Text>
        </View>
      </View>

      {/* Line graph */}
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Practice History (last 30 days)</Text>
        <Legend />
        <View style={styles.graphContainer}>
          <LineGraph data={memberDailyData} />
        </View>
      </View>

    </ScrollView>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F1F8E9' },
  content:  { padding: 20, paddingBottom: 40 },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#558B2F', fontSize: 15 },
  errorText: { color: '#C62828', fontSize: 15, textAlign: 'center' },

  rankCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10, elevation: 3,
  },
  rankMsg: { fontSize: 17, fontWeight: '600', color: '#1B5E20', textAlign: 'center', lineHeight: 24 },
  weeklyRow: {
    marginTop: 18, borderTopWidth: 1, borderTopColor: '#E8F5E9',
    paddingTop: 14, width: '100%', alignItems: 'center',
  },
  weeklyLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  weeklyHours: { fontSize: 32, fontWeight: '800', color: '#2E7D32', marginTop: 4 },

  graphCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10, elevation: 3,
  },
  graphTitle: { fontSize: 15, fontWeight: '700', color: '#1B5E20', marginBottom: 8 },
  graphContainer: { overflow: 'hidden', borderRadius: 8 },

  legend: { flexDirection: 'row', marginBottom: 10, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },
});

const graph = StyleSheet.create({
  empty: { height: G_H, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center' },

  segment: {
    position: 'absolute', height: 2.5,
    backgroundColor: '#2E7D32', borderRadius: 2,
  },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  dotNormal: { backgroundColor: '#2E7D32' },
  dotTournament: { backgroundColor: '#E65100' },

  gridLine: {
    position: 'absolute', height: 1,
    backgroundColor: '#E8F5E9',
  },
  yLabel: {
    position: 'absolute', left: 0, width: 30,
    fontSize: 10, color: '#999', textAlign: 'right',
  },
  xLabel: {
    position: 'absolute', width: 36,
    fontSize: 9, color: '#999', textAlign: 'center',
  },
});
