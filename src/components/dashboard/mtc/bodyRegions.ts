// ─────────────────────────────────────────────────────────────
// Body regions & acupuncture points for interactive 3D mannequin
// Normalized naming · side field · parent hierarchy · regionId links
// ─────────────────────────────────────────────────────────────

export interface BodyRegion {
  id: string;
  name: string;
  description: string;
  side?: "left" | "right" | "center";
  parent?: string;
  position: [number, number, number];
  scale: [number, number, number];
  geometry: {
    type: "sphere" | "capsule" | "box";
    rotation?: [number, number, number];
  };
  meridians: string[];
}

export interface AcuPoint {
  id: string;
  name: string;
  chineseName: string;
  meridian: string;
  side?: "left" | "right" | "center";
  position: [number, number, number];
  regionId: string;
  indications: string;
}

// ═══════════════════ Normalized meridian codes ═══════════════════
// DU  = Du Mai (Vaso Governatore)    REN = Ren Mai (Vaso Concezione)
// LU  = Polmone                      LI  = Intestino Crasso
// ST  = Stomaco                      SP  = Milza
// HT  = Cuore                        SI  = Intestino Tenue
// BL  = Vescica                      KI  = Rene
// PC  = Pericardio                   TE  = Triplice Riscaldatore
// GB  = Vescica Biliare              LR  = Fegato

// ═════════════════════ BODY REGIONS ═════════════════════════════

export const BODY_REGIONS: BodyRegion[] = [
  // ──── HEAD & FACE ────
  { id: "head_top", name: "Vertex / Sommità del capo", description: "GV20 (Baihui), zona vertex", side: "center", position: [0, 1.85, 0], scale: [0.18, 0.18, 0.2], geometry: { type: "sphere" }, meridians: ["DU", "GB"] },
  { id: "forehead", name: "Fronte", description: "Zona frontale, GV24, Yintang", side: "center", parent: "head_top", position: [0, 1.72, 0.14], scale: [0.16, 0.08, 0.06], geometry: { type: "box" }, meridians: ["DU", "ST", "BL"] },
  { id: "temple", name: "Tempia", description: "Taiyang, GB8", side: "left", parent: "head_top", position: [-0.17, 1.68, 0.08], scale: [0.05, 0.05, 0.05], geometry: { type: "sphere" }, meridians: ["GB", "TE"] },
  { id: "temple", name: "Tempia", description: "Taiyang, GB8", side: "right", parent: "head_top", position: [0.17, 1.68, 0.08], scale: [0.05, 0.05, 0.05], geometry: { type: "sphere" }, meridians: ["GB", "TE"] },
  { id: "eye", name: "Zona perioculare", description: "BL1 (Jingming), ST1, GB1", side: "left", parent: "head_top", position: [-0.06, 1.68, 0.14], scale: [0.04, 0.03, 0.03], geometry: { type: "sphere" }, meridians: ["BL", "ST", "GB"] },
  { id: "eye", name: "Zona perioculare", description: "BL1 (Jingming), ST1, GB1", side: "right", parent: "head_top", position: [0.06, 1.68, 0.14], scale: [0.04, 0.03, 0.03], geometry: { type: "sphere" }, meridians: ["BL", "ST", "GB"] },
  { id: "nose", name: "Naso", description: "LI20 (Yingxiang), GV25, DU26", side: "center", parent: "head_top", position: [0, 1.62, 0.16], scale: [0.04, 0.04, 0.03], geometry: { type: "sphere" }, meridians: ["LI", "DU", "ST"] },
  { id: "ear", name: "Orecchio", description: "SI19, TE21, GB2 — zona auricolare", side: "left", parent: "head_top", position: [-0.18, 1.64, 0], scale: [0.04, 0.05, 0.03], geometry: { type: "sphere" }, meridians: ["SI", "TE", "GB"] },
  { id: "ear", name: "Orecchio", description: "SI19, TE21, GB2 — zona auricolare", side: "right", parent: "head_top", position: [0.18, 1.64, 0], scale: [0.04, 0.05, 0.03], geometry: { type: "sphere" }, meridians: ["SI", "TE", "GB"] },
  { id: "jaw", name: "Mandibola", description: "ST6 (Jiache), zona ATM", side: "left", parent: "head_top", position: [-0.12, 1.55, 0.08], scale: [0.06, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["ST", "LI"] },
  { id: "jaw", name: "Mandibola", description: "ST6 (Jiache), zona ATM", side: "right", parent: "head_top", position: [0.12, 1.55, 0.08], scale: [0.06, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["ST", "LI"] },
  { id: "occiput", name: "Occipite", description: "GB20 (Fengchi), BL10", side: "center", parent: "head_top", position: [0, 1.7, -0.14], scale: [0.14, 0.1, 0.06], geometry: { type: "box" }, meridians: ["GB", "BL", "DU"] },

  // ──── NECK ────
  { id: "neck_front", name: "Collo anteriore", description: "CV22 (Tiantu), zona tiroidea", side: "center", position: [0, 1.42, 0.08], scale: [0.08, 0.08, 0.06], geometry: { type: "capsule" }, meridians: ["REN", "ST"] },
  { id: "neck_back", name: "Collo posteriore", description: "GV14 (Dazhui), cervicale", side: "center", position: [0, 1.42, -0.08], scale: [0.08, 0.08, 0.06], geometry: { type: "capsule" }, meridians: ["DU", "BL", "SI"] },
  { id: "neck_lateral", name: "Collo laterale", description: "SI17, LI18, zona SCM", side: "left", position: [-0.1, 1.42, 0.04], scale: [0.04, 0.06, 0.04], geometry: { type: "sphere" }, meridians: ["SI", "LI", "GB"] },
  { id: "neck_lateral", name: "Collo laterale", description: "SI17, LI18, zona SCM", side: "right", position: [0.1, 1.42, 0.04], scale: [0.04, 0.06, 0.04], geometry: { type: "sphere" }, meridians: ["SI", "LI", "GB"] },

  // ──── SHOULDERS ────
  { id: "shoulder", name: "Spalla", description: "LI15, GB21 (Jianjing)", side: "left", position: [-0.28, 1.32, 0], scale: [0.1, 0.06, 0.08], geometry: { type: "sphere" }, meridians: ["LI", "GB", "TE"] },
  { id: "shoulder", name: "Spalla", description: "LI15, GB21 (Jianjing)", side: "right", position: [0.28, 1.32, 0], scale: [0.1, 0.06, 0.08], geometry: { type: "sphere" }, meridians: ["LI", "GB", "TE"] },
  { id: "scapula", name: "Scapola", description: "SI11, SI12, BL43", side: "left", position: [-0.18, 1.18, -0.1], scale: [0.08, 0.08, 0.04], geometry: { type: "box" }, meridians: ["SI", "BL"] },
  { id: "scapula", name: "Scapola", description: "SI11, SI12, BL43", side: "right", position: [0.18, 1.18, -0.1], scale: [0.08, 0.08, 0.04], geometry: { type: "box" }, meridians: ["SI", "BL"] },

  // ──── CHEST ────
  { id: "chest_upper", name: "Torace superiore / Sterno", description: "CV17 (Shanzhong), zona sternale", side: "center", position: [0, 1.22, 0.1], scale: [0.2, 0.08, 0.06], geometry: { type: "box" }, meridians: ["REN", "LU", "HT"] },
  { id: "chest", name: "Torace", description: "Zona costale, LU1", side: "left", parent: "chest_upper", position: [-0.15, 1.12, 0.08], scale: [0.1, 0.1, 0.06], geometry: { type: "box" }, meridians: ["LU", "SP"] },
  { id: "chest", name: "Torace", description: "Zona costale", side: "right", parent: "chest_upper", position: [0.15, 1.12, 0.08], scale: [0.1, 0.1, 0.06], geometry: { type: "box" }, meridians: ["LU", "LR"] },
  { id: "ribs_lateral", name: "Costato laterale", description: "GB24, LR14 — ipocondrio", side: "left", parent: "chest_upper", position: [-0.22, 1.05, 0.04], scale: [0.05, 0.08, 0.06], geometry: { type: "box" }, meridians: ["GB", "LR", "SP"] },
  { id: "ribs_lateral", name: "Costato laterale", description: "GB24, LR14 — ipocondrio", side: "right", parent: "chest_upper", position: [0.22, 1.05, 0.04], scale: [0.05, 0.08, 0.06], geometry: { type: "box" }, meridians: ["GB", "LR"] },

  // ──── BACK ────
  { id: "upper_back", name: "Dorso superiore", description: "BL11-BL15, zona dorsale", side: "center", position: [0, 1.22, -0.1], scale: [0.22, 0.12, 0.06], geometry: { type: "box" }, meridians: ["BL", "DU", "SI"] },
  { id: "mid_back", name: "Dorso medio", description: "BL18-BL21, zona lombo-dorsale", side: "center", position: [0, 1.0, -0.1], scale: [0.2, 0.1, 0.06], geometry: { type: "box" }, meridians: ["BL", "DU"] },
  { id: "lower_back", name: "Zona lombare", description: "BL23 (Shenshu), GV4 (Mingmen)", side: "center", position: [0, 0.82, -0.1], scale: [0.2, 0.1, 0.06], geometry: { type: "box" }, meridians: ["BL", "DU", "KI"] },

  // ──── ABDOMEN ────
  { id: "epigastrium", name: "Epigastrio", description: "CV12 (Zhongwan), zona gastrica", side: "center", position: [0, 1.02, 0.1], scale: [0.14, 0.08, 0.06], geometry: { type: "box" }, meridians: ["REN", "ST", "SP"] },
  { id: "umbilical", name: "Zona ombelicale", description: "CV8 (Shenque), ST25 (Tianshu)", side: "center", position: [0, 0.9, 0.12], scale: [0.16, 0.08, 0.06], geometry: { type: "box" }, meridians: ["REN", "ST", "LI"] },
  { id: "lower_abdomen", name: "Ipogastrio", description: "CV4 (Guanyuan), CV6 (Qihai)", side: "center", position: [0, 0.78, 0.12], scale: [0.16, 0.08, 0.06], geometry: { type: "box" }, meridians: ["REN", "KI", "LR"] },
  { id: "flank", name: "Fianco", description: "GB26, zona ipocondrio", side: "left", position: [-0.2, 0.95, 0.04], scale: [0.06, 0.1, 0.08], geometry: { type: "box" }, meridians: ["GB", "LR"] },
  { id: "flank", name: "Fianco", description: "GB26, zona ipocondrio", side: "right", position: [0.2, 0.95, 0.04], scale: [0.06, 0.1, 0.08], geometry: { type: "box" }, meridians: ["GB", "LR"] },
  { id: "inguinal", name: "Inguine", description: "ST30, SP12 — zona inguinale", side: "left", position: [-0.12, 0.72, 0.1], scale: [0.06, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["ST", "SP", "LR"] },
  { id: "inguinal", name: "Inguine", description: "ST30, SP12 — zona inguinale", side: "right", position: [0.12, 0.72, 0.1], scale: [0.06, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["ST", "SP", "LR"] },

  // ──── ARMS ────
  { id: "upper_arm", name: "Braccio", description: "LI11 (Quchi), meridiano intestino crasso", side: "left", position: [-0.38, 1.12, 0], scale: [0.06, 0.14, 0.06], geometry: { type: "capsule" }, meridians: ["LI", "LU", "HT"] },
  { id: "upper_arm", name: "Braccio", description: "LI11 (Quchi)", side: "right", position: [0.38, 1.12, 0], scale: [0.06, 0.14, 0.06], geometry: { type: "capsule" }, meridians: ["LI", "LU", "HT"] },
  { id: "elbow", name: "Gomito", description: "LI11, HT3, LU5", side: "left", parent: "upper_arm", position: [-0.40, 1.0, 0.02], scale: [0.04, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["LI", "HT", "LU"] },
  { id: "elbow", name: "Gomito", description: "LI11, HT3, LU5", side: "right", parent: "upper_arm", position: [0.40, 1.0, 0.02], scale: [0.04, 0.04, 0.04], geometry: { type: "sphere" }, meridians: ["LI", "HT", "LU"] },
  { id: "forearm", name: "Avambraccio", description: "PC6 (Neiguan), LI4 (Hegu)", side: "left", parent: "upper_arm", position: [-0.42, 0.88, 0.04], scale: [0.05, 0.12, 0.05], geometry: { type: "capsule" }, meridians: ["PC", "LI", "TE"] },
  { id: "forearm", name: "Avambraccio", description: "PC6 (Neiguan), LI4 (Hegu)", side: "right", parent: "upper_arm", position: [0.42, 0.88, 0.04], scale: [0.05, 0.12, 0.05], geometry: { type: "capsule" }, meridians: ["PC", "LI", "TE"] },
  { id: "wrist", name: "Polso", description: "HT7 (Shenmen), LU9 (Taiyuan), PC7", side: "left", parent: "upper_arm", position: [-0.43, 0.78, 0.05], scale: [0.03, 0.03, 0.03], geometry: { type: "sphere" }, meridians: ["HT", "LU", "PC"] },
  { id: "wrist", name: "Polso", description: "HT7 (Shenmen), LU9 (Taiyuan), PC7", side: "right", parent: "upper_arm", position: [0.43, 0.78, 0.05], scale: [0.03, 0.03, 0.03], geometry: { type: "sphere" }, meridians: ["HT", "LU", "PC"] },
  { id: "hand", name: "Mano", description: "LI4, HT7, SI3", side: "left", parent: "upper_arm", position: [-0.44, 0.72, 0.06], scale: [0.04, 0.06, 0.03], geometry: { type: "box" }, meridians: ["LI", "HT", "SI", "LU"] },
  { id: "hand", name: "Mano", description: "LI4, HT7, SI3", side: "right", parent: "upper_arm", position: [0.44, 0.72, 0.06], scale: [0.04, 0.06, 0.03], geometry: { type: "box" }, meridians: ["LI", "HT", "SI", "LU"] },

  // ──── PELVIS & HIP ────
  { id: "sacrum", name: "Sacro", description: "GV2, BL31-34 (punti Baliao)", side: "center", position: [0, 0.68, -0.08], scale: [0.16, 0.08, 0.06], geometry: { type: "box" }, meridians: ["DU", "BL"] },
  { id: "gluteal", name: "Gluteo", description: "BL36, BL54 — zona glutea", side: "left", parent: "sacrum", position: [-0.14, 0.62, -0.06], scale: [0.08, 0.06, 0.06], geometry: { type: "sphere" }, meridians: ["BL", "GB"] },
  { id: "gluteal", name: "Gluteo", description: "BL36, BL54 — zona glutea", side: "right", parent: "sacrum", position: [0.14, 0.62, -0.06], scale: [0.08, 0.06, 0.06], geometry: { type: "sphere" }, meridians: ["BL", "GB"] },
  { id: "hip", name: "Anca", description: "GB30 (Huantiao)", side: "left", position: [-0.18, 0.65, -0.02], scale: [0.08, 0.06, 0.08], geometry: { type: "sphere" }, meridians: ["GB", "BL"] },
  { id: "hip", name: "Anca", description: "GB30 (Huantiao)", side: "right", position: [0.18, 0.65, -0.02], scale: [0.08, 0.06, 0.08], geometry: { type: "sphere" }, meridians: ["GB", "BL"] },

  // ──── LEGS ────
  { id: "thigh_front", name: "Coscia anteriore", description: "ST34 (Liangqiu), ST32", side: "left", position: [-0.14, 0.48, 0.06], scale: [0.07, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["ST", "SP"] },
  { id: "thigh_front", name: "Coscia anteriore", description: "ST34 (Liangqiu), ST32", side: "right", position: [0.14, 0.48, 0.06], scale: [0.07, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["ST", "SP"] },
  { id: "thigh_lateral", name: "Coscia laterale", description: "GB31 (Fengshi), banda IT", side: "left", position: [-0.20, 0.48, 0], scale: [0.04, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["GB"] },
  { id: "thigh_lateral", name: "Coscia laterale", description: "GB31 (Fengshi), banda IT", side: "right", position: [0.20, 0.48, 0], scale: [0.04, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["GB"] },
  { id: "thigh_back", name: "Coscia posteriore", description: "BL36, BL37 — zona ischio-crurale", side: "left", position: [-0.14, 0.48, -0.04], scale: [0.07, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["BL"] },
  { id: "thigh_back", name: "Coscia posteriore", description: "BL36, BL37 — zona ischio-crurale", side: "right", position: [0.14, 0.48, -0.04], scale: [0.07, 0.12, 0.06], geometry: { type: "capsule" }, meridians: ["BL"] },
  { id: "knee", name: "Ginocchio", description: "ST36 (Zusanli), SP9, EX-LE5 (Xiyan)", side: "left", position: [-0.14, 0.28, 0.04], scale: [0.07, 0.06, 0.07], geometry: { type: "sphere" }, meridians: ["ST", "SP", "BL"] },
  { id: "knee", name: "Ginocchio", description: "ST36 (Zusanli), SP9, EX-LE5 (Xiyan)", side: "right", position: [0.14, 0.28, 0.04], scale: [0.07, 0.06, 0.07], geometry: { type: "sphere" }, meridians: ["ST", "SP", "BL"] },
  { id: "knee_back", name: "Cavo popliteo", description: "BL40 (Weizhong)", side: "left", parent: "knee", position: [-0.14, 0.28, -0.04], scale: [0.05, 0.05, 0.05], geometry: { type: "sphere" }, meridians: ["BL"] },
  { id: "knee_back", name: "Cavo popliteo", description: "BL40 (Weizhong)", side: "right", parent: "knee", position: [0.14, 0.28, -0.04], scale: [0.05, 0.05, 0.05], geometry: { type: "sphere" }, meridians: ["BL"] },
  { id: "lower_leg", name: "Gamba", description: "SP6 (Sanyinjiao), GB34 (Yanglingquan)", side: "left", position: [-0.13, 0.14, 0.02], scale: [0.05, 0.1, 0.05], geometry: { type: "capsule" }, meridians: ["SP", "LR", "KI", "GB"] },
  { id: "lower_leg", name: "Gamba", description: "SP6 (Sanyinjiao), GB34 (Yanglingquan)", side: "right", position: [0.13, 0.14, 0.02], scale: [0.05, 0.1, 0.05], geometry: { type: "capsule" }, meridians: ["SP", "LR", "KI", "GB"] },
  { id: "calf", name: "Polpaccio", description: "BL57 (Chengshan), zona gastrocnemio", side: "left", parent: "lower_leg", position: [-0.13, 0.14, -0.04], scale: [0.05, 0.1, 0.05], geometry: { type: "capsule" }, meridians: ["BL"] },
  { id: "calf", name: "Polpaccio", description: "BL57 (Chengshan), zona gastrocnemio", side: "right", parent: "lower_leg", position: [0.13, 0.14, -0.04], scale: [0.05, 0.1, 0.05], geometry: { type: "capsule" }, meridians: ["BL"] },
  { id: "ankle", name: "Caviglia", description: "KI3, SP6, BL60", side: "left", position: [-0.13, -0.02, 0.02], scale: [0.05, 0.04, 0.05], geometry: { type: "sphere" }, meridians: ["KI", "SP", "BL"] },
  { id: "ankle", name: "Caviglia", description: "KI3, SP6, BL60", side: "right", position: [0.13, -0.02, 0.02], scale: [0.05, 0.04, 0.05], geometry: { type: "sphere" }, meridians: ["KI", "SP", "BL"] },
  { id: "heel", name: "Tallone", description: "BL60 (Kunlun), KI3 (Taixi)", side: "left", parent: "ankle", position: [-0.13, -0.08, -0.04], scale: [0.04, 0.03, 0.04], geometry: { type: "sphere" }, meridians: ["BL", "KI"] },
  { id: "heel", name: "Tallone", description: "BL60 (Kunlun), KI3 (Taixi)", side: "right", parent: "ankle", position: [0.13, -0.08, -0.04], scale: [0.04, 0.03, 0.04], geometry: { type: "sphere" }, meridians: ["BL", "KI"] },
  { id: "foot", name: "Piede", description: "KI1 (Yongquan), LR3 (Taichong)", side: "left", parent: "ankle", position: [-0.13, -0.1, 0.06], scale: [0.05, 0.03, 0.08], geometry: { type: "box" }, meridians: ["KI", "LR", "ST", "GB"] },
  { id: "foot", name: "Piede", description: "KI1 (Yongquan), LR3 (Taichong)", side: "right", parent: "ankle", position: [0.13, -0.1, 0.06], scale: [0.05, 0.03, 0.08], geometry: { type: "box" }, meridians: ["KI", "LR", "ST", "GB"] },
];

// ═════════════════════ ACUPUNCTURE POINTS ═══════════════════════

export const ACUPOINTS: AcuPoint[] = [
  // ──── Head ────
  { id: "GV20", name: "Baihui", chineseName: "百会", meridian: "DU", side: "center", position: [0, 1.9, 0], regionId: "head_top", indications: "Cefalea vertex, vertigini, insonnia" },
  { id: "GB20", name: "Fengchi", chineseName: "风池", meridian: "GB", side: "left", position: [-0.1, 1.7, -0.16], regionId: "occiput", indications: "Cefalea occipitale, rigidità cervicale" },
  { id: "GB20", name: "Fengchi", chineseName: "风池", meridian: "GB", side: "right", position: [0.1, 1.7, -0.16], regionId: "occiput", indications: "Cefalea occipitale, rigidità cervicale" },

  // ──── Neck & Shoulder ────
  { id: "GB21", name: "Jianjing", chineseName: "肩井", meridian: "GB", side: "left", position: [-0.2, 1.35, -0.02], regionId: "shoulder", indications: "Dolore spalla, tensione trapezio" },
  { id: "GB21", name: "Jianjing", chineseName: "肩井", meridian: "GB", side: "right", position: [0.2, 1.35, -0.02], regionId: "shoulder", indications: "Dolore spalla, tensione trapezio" },
  { id: "GV14", name: "Dazhui", chineseName: "大椎", meridian: "DU", side: "center", position: [0, 1.38, -0.1], regionId: "neck_back", indications: "Febbre, rigidità cervicale, punto immunostimolante" },

  // ──── Upper limb ────
  { id: "LI4", name: "Hegu", chineseName: "合谷", meridian: "LI", side: "left", position: [-0.44, 0.74, 0.06], regionId: "hand", indications: "Cefalea, dolore facciale, immunità" },
  { id: "LI4", name: "Hegu", chineseName: "合谷", meridian: "LI", side: "right", position: [0.44, 0.74, 0.06], regionId: "hand", indications: "Cefalea, dolore facciale, immunità" },
  { id: "LI11", name: "Quchi", chineseName: "曲池", meridian: "LI", side: "left", position: [-0.4, 1.0, 0.04], regionId: "elbow", indications: "Dolore gomito, febbre, ipertensione" },
  { id: "LI11", name: "Quchi", chineseName: "曲池", meridian: "LI", side: "right", position: [0.4, 1.0, 0.04], regionId: "elbow", indications: "Dolore gomito, febbre, ipertensione" },
  { id: "PC6", name: "Neiguan", chineseName: "内关", meridian: "PC", side: "left", position: [-0.42, 0.82, 0.06], regionId: "forearm", indications: "Nausea, ansia, palpitazioni, dolore toracico" },
  { id: "PC6", name: "Neiguan", chineseName: "内关", meridian: "PC", side: "right", position: [0.42, 0.82, 0.06], regionId: "forearm", indications: "Nausea, ansia, palpitazioni, dolore toracico" },
  { id: "HT7", name: "Shenmen", chineseName: "神门", meridian: "HT", side: "left", position: [-0.43, 0.78, 0.04], regionId: "wrist", indications: "Insonnia, ansia, palpitazioni" },
  { id: "HT7", name: "Shenmen", chineseName: "神门", meridian: "HT", side: "right", position: [0.43, 0.78, 0.04], regionId: "wrist", indications: "Insonnia, ansia, palpitazioni" },
  { id: "LU9", name: "Taiyuan", chineseName: "太渊", meridian: "LU", side: "left", position: [-0.43, 0.78, 0.06], regionId: "wrist", indications: "Tosse, dispnea, polso debole" },

  // ──── Trunk ────
  { id: "CV17", name: "Shanzhong", chineseName: "膻中", meridian: "REN", side: "center", position: [0, 1.2, 0.14], regionId: "chest_upper", indications: "Oppressione toracica, dispnea, mastite" },
  { id: "CV12", name: "Zhongwan", chineseName: "中脘", meridian: "REN", side: "center", position: [0, 1.02, 0.15], regionId: "epigastrium", indications: "Gastralgia, nausea, disturbi digestivi" },
  { id: "CV4", name: "Guanyuan", chineseName: "关元", meridian: "REN", side: "center", position: [0, 0.78, 0.15], regionId: "lower_abdomen", indications: "Tonificazione Qi/Yang, dismenorrea, astenia" },
  { id: "CV6", name: "Qihai", chineseName: "气海", meridian: "REN", side: "center", position: [0, 0.82, 0.15], regionId: "lower_abdomen", indications: "Astenia, deficit di Qi, gonfiore addominale" },
  { id: "ST25", name: "Tianshu", chineseName: "天枢", meridian: "ST", side: "left", position: [-0.08, 0.9, 0.15], regionId: "umbilical", indications: "Dolore addominale, stipsi, diarrea" },
  { id: "ST25", name: "Tianshu", chineseName: "天枢", meridian: "ST", side: "right", position: [0.08, 0.9, 0.15], regionId: "umbilical", indications: "Dolore addominale, stipsi, diarrea" },

  // ──── Back ────
  { id: "BL23", name: "Shenshu", chineseName: "肾俞", meridian: "BL", side: "left", position: [-0.06, 0.82, -0.14], regionId: "lower_back", indications: "Lombalgia, deficit di Rene, tinnito" },
  { id: "BL23", name: "Shenshu", chineseName: "肾俞", meridian: "BL", side: "right", position: [0.06, 0.82, -0.14], regionId: "lower_back", indications: "Lombalgia, deficit di Rene, tinnito" },
  { id: "GV4", name: "Mingmen", chineseName: "命门", meridian: "DU", side: "center", position: [0, 0.84, -0.14], regionId: "lower_back", indications: "Lombalgia, deficit Yang di Rene" },
  { id: "BL18", name: "Ganshu", chineseName: "肝俞", meridian: "BL", side: "left", position: [-0.06, 1.02, -0.14], regionId: "mid_back", indications: "Disturbi epatici, irritabilità, disturbi visivi" },
  { id: "BL18", name: "Ganshu", chineseName: "肝俞", meridian: "BL", side: "right", position: [0.06, 1.02, -0.14], regionId: "mid_back", indications: "Disturbi epatici, irritabilità, disturbi visivi" },
  { id: "BL13", name: "Feishu", chineseName: "肺俞", meridian: "BL", side: "left", position: [-0.06, 1.22, -0.14], regionId: "upper_back", indications: "Tosse, asma, disturbi polmonari" },
  { id: "BL15", name: "Xinshu", chineseName: "心俞", meridian: "BL", side: "left", position: [-0.06, 1.16, -0.14], regionId: "upper_back", indications: "Palpitazioni, insonnia, ansia" },

  // ──── Lower limb ────
  { id: "ST36", name: "Zusanli", chineseName: "足三里", meridian: "ST", side: "left", position: [-0.16, 0.22, 0.08], regionId: "knee", indications: "Tonificazione generale, disturbi gastrici" },
  { id: "ST36", name: "Zusanli", chineseName: "足三里", meridian: "ST", side: "right", position: [0.16, 0.22, 0.08], regionId: "knee", indications: "Tonificazione generale, disturbi gastrici" },
  { id: "SP6", name: "Sanyinjiao", chineseName: "三阴交", meridian: "SP", side: "left", position: [-0.15, 0.04, 0.04], regionId: "lower_leg", indications: "Dismenorrea, insonnia, deficit di Sangue" },
  { id: "SP6", name: "Sanyinjiao", chineseName: "三阴交", meridian: "SP", side: "right", position: [0.15, 0.04, 0.04], regionId: "lower_leg", indications: "Dismenorrea, insonnia, deficit di Sangue" },
  { id: "GB34", name: "Yanglingquan", chineseName: "阳陵泉", meridian: "GB", side: "left", position: [-0.17, 0.2, 0.02], regionId: "lower_leg", indications: "Dolore ginocchio, tendini, ipocondrio" },
  { id: "GB34", name: "Yanglingquan", chineseName: "阳陵泉", meridian: "GB", side: "right", position: [0.17, 0.2, 0.02], regionId: "lower_leg", indications: "Dolore ginocchio, tendini, ipocondrio" },
  { id: "BL40", name: "Weizhong", chineseName: "委中", meridian: "BL", side: "left", position: [-0.14, 0.28, -0.06], regionId: "knee_back", indications: "Lombalgia acuta, sciatalgia, dolore ginocchio posteriore" },
  { id: "BL40", name: "Weizhong", chineseName: "委中", meridian: "BL", side: "right", position: [0.14, 0.28, -0.06], regionId: "knee_back", indications: "Lombalgia acuta, sciatalgia, dolore ginocchio posteriore" },
  { id: "KI3", name: "Taixi", chineseName: "太溪", meridian: "KI", side: "left", position: [-0.15, -0.02, -0.02], regionId: "ankle", indications: "Deficit Rene, lombalgia, tinnito, insonnia" },
  { id: "KI3", name: "Taixi", chineseName: "太溪", meridian: "KI", side: "right", position: [0.15, -0.02, -0.02], regionId: "ankle", indications: "Deficit Rene, lombalgia, tinnito, insonnia" },
  { id: "LR3", name: "Taichong", chineseName: "太冲", meridian: "LR", side: "left", position: [-0.14, -0.1, 0.1], regionId: "foot", indications: "Stasi di Qi Fegato, cefalea, irritabilità" },
  { id: "LR3", name: "Taichong", chineseName: "太冲", meridian: "LR", side: "right", position: [0.14, -0.1, 0.1], regionId: "foot", indications: "Stasi di Qi Fegato, cefalea, irritabilità" },
  { id: "BL60", name: "Kunlun", chineseName: "昆仑", meridian: "BL", side: "left", position: [-0.16, -0.02, -0.04], regionId: "ankle", indications: "Lombalgia, cervicalgia, dolore caviglia" },
  { id: "BL60", name: "Kunlun", chineseName: "昆仑", meridian: "BL", side: "right", position: [0.16, -0.02, -0.04], regionId: "ankle", indications: "Lombalgia, cervicalgia, dolore caviglia" },
  { id: "BL57", name: "Chengshan", chineseName: "承山", meridian: "BL", side: "left", position: [-0.13, 0.12, -0.06], regionId: "calf", indications: "Crampi polpaccio, lombalgia, emorroidi" },
  { id: "BL57", name: "Chengshan", chineseName: "承山", meridian: "BL", side: "right", position: [0.13, 0.12, -0.06], regionId: "calf", indications: "Crampi polpaccio, lombalgia, emorroidi" },
  { id: "KI1", name: "Yongquan", chineseName: "涌泉", meridian: "KI", side: "left", position: [-0.13, -0.12, 0.08], regionId: "foot", indications: "Emergenze, perdita di coscienza, ansia" },
  { id: "KI1", name: "Yongquan", chineseName: "涌泉", meridian: "KI", side: "right", position: [0.13, -0.12, 0.08], regionId: "foot", indications: "Emergenze, perdita di coscienza, ansia" },
  { id: "GB30", name: "Huantiao", chineseName: "环跳", meridian: "GB", side: "left", position: [-0.18, 0.65, -0.04], regionId: "hip", indications: "Sciatalgia, dolore anca, lombalgia" },
  { id: "GB30", name: "Huantiao", chineseName: "环跳", meridian: "GB", side: "right", position: [0.18, 0.65, -0.04], regionId: "hip", indications: "Sciatalgia, dolore anca, lombalgia" },
  { id: "GB31", name: "Fengshi", chineseName: "风市", meridian: "GB", side: "left", position: [-0.20, 0.48, 0.02], regionId: "thigh_lateral", indications: "Dolore laterale coscia, parestesie" },
  { id: "GB31", name: "Fengshi", chineseName: "风市", meridian: "GB", side: "right", position: [0.20, 0.48, 0.02], regionId: "thigh_lateral", indications: "Dolore laterale coscia, parestesie" },
];

// ──── Helpers ────

/** Generate a unique key for a region (id + side) to use as Map/Set key */
export function regionKey(region: BodyRegion): string {
  return region.side && region.side !== "center"
    ? `${region.id}_${region.side[0]}`
    : region.id;
}

/** Readable meridian label map */
export const MERIDIAN_LABELS: Record<string, string> = {
  DU: "Du Mai (Vaso Governatore)",
  REN: "Ren Mai (Vaso Concezione)",
  LU: "Polmone",
  LI: "Intestino Crasso",
  ST: "Stomaco",
  SP: "Milza",
  HT: "Cuore",
  SI: "Intestino Tenue",
  BL: "Vescica",
  KI: "Rene",
  PC: "Pericardio",
  TE: "Triplice Riscaldatore",
  GB: "Vescica Biliare",
  LR: "Fegato",
};

/** Convert normalized meridian codes to readable labels */
export function meridianLabels(codes: string[]): string {
  return codes.map(c => MERIDIAN_LABELS[c] ?? c).join(", ");
}
