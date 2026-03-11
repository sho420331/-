import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AttendanceRequest, Staff, ShiftAssignment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const shiftSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "YYYY-MM-DD format" },
      childName: { type: Type.STRING },
      timeSlot: { type: Type.STRING },
      staffName: { type: Type.STRING, description: "Name of the staff assigned" },
    },
    required: ["date", "childName", "timeSlot", "staffName"],
  },
};

export const generateAutoSchedule = async (
  requests: AttendanceRequest[],
  staffList: Staff[]
): Promise<ShiftAssignment[]> => {
  if (requests.length === 0 || staffList.length === 0) {
    throw new Error("シフトを作成するには、登園希望とスタッフ登録が必要です。");
  }

  // Filter available staff
  const availableStaff = staffList.filter(s => s.isAvailable);
  if (availableStaff.length === 0) {
     throw new Error("利用可能なスタッフがいません。スタッフ管理画面で出勤可能に設定してください。");
  }

  const prompt = `
    あなたは障がい者福祉施設のシフト管理者です。
    以下の「登園希望リスト」と「スタッフリスト」をもとに、適切なシフト表を作成してください。

    条件:
    1. 全ての登園希望に対して、必ず1名のスタッフを割り当ててください。
    2. スタッフの負担がなるべく均等になるようにしてください。
    3. 利用可能なスタッフのみを割り当ててください。
    4. 「勤務形態(schedule)」に記載されている曜日や条件を厳守してください。休み希望の日にシフトを入れないでください。
    5. 出力はJSON形式のみで返してください。

    [登園希望リスト]
    ${JSON.stringify(requests.map(r => ({ date: r.date, child: r.childName, time: r.timeSlot })))}

    [利用可能なスタッフリスト]
    ${JSON.stringify(availableStaff.map(s => ({
      name: s.name,
      schedule: s.workSchedule || "特になし (全日可)"
    })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: shiftSchema,
        temperature: 0.2, // Low temperature for deterministic/logical assignment
      },
    });

    const rawData = response.text;
    if (!rawData) return [];

    // Sanitize: Remove markdown code blocks if present (e.g. ```json ... ```)
    const cleanJson = rawData.replace(/```json\n?|\n?```/g, '').trim();

    const assignments = JSON.parse(cleanJson);
    
    // Add IDs to the generated assignments
    return assignments.map((a: any, index: number) => ({
      ...a,
      id: `auto-shift-${Date.now()}-${index}`,
    }));

  } catch (error) {
    console.error("Gemini Shift Generation Error:", error);
    throw new Error("AIによるシフト自動作成に失敗しました。しばらく待ってから再試行してください。");
  }
};