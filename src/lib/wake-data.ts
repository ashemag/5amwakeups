export type Member = {
  id: string;
  name: string;
  handle: string;
  city: string;
  streak: number;
  wakeTime: string;
  bestTime: string;
  avatarUrl: string;
  ouraConnected: boolean;
  weeklyTimes: string[];
};

export type WakeStatus = {
  qualifies: boolean;
  score: number;
  label: string;
  accent: string;
  surface: string;
  border: string;
};

const palette = {
  green: {
    accent: "#5b8f5f",
    surface: "rgba(91, 143, 95, 0.12)",
    border: "rgba(91, 143, 95, 0.28)",
  },
  moss: {
    accent: "#7f9362",
    surface: "rgba(127, 147, 98, 0.12)",
    border: "rgba(127, 147, 98, 0.28)",
  },
  sand: {
    accent: "#a7855b",
    surface: "rgba(167, 133, 91, 0.12)",
    border: "rgba(167, 133, 91, 0.28)",
  },
  amber: {
    accent: "#b36949",
    surface: "rgba(179, 105, 73, 0.12)",
    border: "rgba(179, 105, 73, 0.28)",
  },
  rose: {
    accent: "#a55757",
    surface: "rgba(165, 87, 87, 0.12)",
    border: "rgba(165, 87, 87, 0.28)",
  },
  slate: {
    accent: "#7f746a",
    surface: "rgba(127, 116, 106, 0.12)",
    border: "rgba(127, 116, 106, 0.2)",
  },
} as const;

export const sampleMembers: Member[] = [
  {
    id: "1",
    name: "Maya Chen",
    handle: "mayaonmornings",
    city: "San Francisco",
    streak: 24,
    wakeTime: "04:54",
    bestTime: "04:48",
    avatarUrl: "https://unavatar.io/x/mayaonmornings",
    ouraConnected: true,
    weeklyTimes: ["04:58", "04:55", "04:52", "05:01", "04:54", "04:50", "04:54"],
  },
  {
    id: "2",
    name: "Jonas Vale",
    handle: "jonaswrites",
    city: "New York",
    streak: 17,
    wakeTime: "05:03",
    bestTime: "04:59",
    avatarUrl: "https://unavatar.io/x/jonaswrites",
    ouraConnected: true,
    weeklyTimes: ["05:06", "05:00", "05:09", "05:04", "05:03", "05:01", "05:03"],
  },
  {
    id: "3",
    name: "Ari Sol",
    handle: "arisol",
    city: "Austin",
    streak: 11,
    wakeTime: "05:12",
    bestTime: "04:57",
    avatarUrl: "https://unavatar.io/x/arisol",
    ouraConnected: true,
    weeklyTimes: ["05:15", "05:11", "04:57", "05:08", "05:13", "05:16", "05:12"],
  },
  {
    id: "4",
    name: "Nina Park",
    handle: "npark",
    city: "Seattle",
    streak: 9,
    wakeTime: "05:28",
    bestTime: "05:01",
    avatarUrl: "https://unavatar.io/x/npark",
    ouraConnected: true,
    weeklyTimes: ["05:31", "05:24", "05:28", "05:18", "05:12", "05:06", "05:28"],
  },
  {
    id: "5",
    name: "Leo Hart",
    handle: "leohart",
    city: "Chicago",
    streak: 6,
    wakeTime: "05:44",
    bestTime: "05:02",
    avatarUrl: "https://unavatar.io/x/leohart",
    ouraConnected: true,
    weeklyTimes: ["05:51", "05:34", "05:27", "05:19", "05:14", "05:10", "05:44"],
  },
  {
    id: "6",
    name: "River Bloom",
    handle: "riverblooms",
    city: "London",
    streak: 0,
    wakeTime: "06:07",
    bestTime: "05:08",
    avatarUrl: "https://unavatar.io/x/riverblooms",
    ouraConnected: true,
    weeklyTimes: ["05:22", "05:16", "05:08", "06:12", "05:48", "06:03", "06:07"],
  },
];

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatWakeTime(time: string) {
  const totalMinutes = parseTimeToMinutes(time);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

export function getWakeStatus(time: string): WakeStatus {
  const minutes = parseTimeToMinutes(time);

  if (minutes <= 300) {
    return { qualifies: true, score: 100, label: "Before 5", ...palette.green };
  }

  if (minutes <= 315) {
    return {
      qualifies: true,
      score: 100 - (minutes - 300) * 1.7,
      label: "Early edge",
      ...palette.moss,
    };
  }

  if (minutes <= 330) {
    return {
      qualifies: true,
      score: 74 - (minutes - 315) * 1.2,
      label: "Still in",
      ...palette.sand,
    };
  }

  if (minutes <= 345) {
    return {
      qualifies: true,
      score: 56 - (minutes - 330) * 1.1,
      label: "Hanging on",
      ...palette.amber,
    };
  }

  if (minutes <= 359) {
    return {
      qualifies: true,
      score: 39 - (minutes - 345),
      label: "Final minutes",
      ...palette.rose,
    };
  }

  return { qualifies: false, score: 0, label: "Missed window", ...palette.slate };
}

export function getLeaderboard(members: Member[]) {
  return [...members].sort((left, right) => {
    const leftStatus = getWakeStatus(left.wakeTime);
    const rightStatus = getWakeStatus(right.wakeTime);

    if (leftStatus.qualifies !== rightStatus.qualifies) {
      return Number(rightStatus.qualifies) - Number(leftStatus.qualifies);
    }

    if (rightStatus.score !== leftStatus.score) {
      return rightStatus.score - leftStatus.score;
    }

    if (right.streak !== left.streak) {
      return right.streak - left.streak;
    }

    return left.name.localeCompare(right.name);
  });
}

export function buildDemoMember(input: {
  name: string;
  handle: string;
  wakeTime: string;
  connected: boolean;
}): Member {
  return {
    id: "you",
    name: input.name.trim() || "You",
    handle: input.handle.trim().replace(/^@/, "") || "yourname",
    city: "Preview",
    streak: input.connected ? 1 : 0,
    wakeTime: input.wakeTime,
    bestTime: input.wakeTime,
    avatarUrl: `https://unavatar.io/x/${input.handle.trim().replace(/^@/, "") || "x"}`,
    ouraConnected: input.connected,
    weeklyTimes: [
      "05:14",
      "05:08",
      "05:03",
      "05:01",
      "04:59",
      "05:02",
      input.wakeTime,
    ],
  };
}

export function getQualifyingCount(members: Member[]) {
  return members.filter((member) => getWakeStatus(member.wakeTime).qualifies).length;
}
