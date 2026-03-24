// Body regions for the 3D mannequin with acupuncture meridian mappings
export interface BodyRegion {
  id: string;
  name: string;
  description: string;
  position: [number, number, number]; // x, y, z in 3D space
  scale: [number, number, number];
  meridians: string[];
  geometry: "sphere" | "capsule" | "box";
}

export const BODY_REGIONS: BodyRegion[] = [
  // Head & Face
  { id: "head_top", name: "Vertex / Sommità del capo", description: "GV20 (Baihui), zona vertex", position: [0, 1.85, 0], scale: [0.18, 0.18, 0.2], meridians: ["Du Mai (Vaso Governatore)", "Vescica Biliare"], geometry: "sphere" },
  { id: "forehead", name: "Fronte", description: "Zona frontale, GV24, Yintang", position: [0, 1.72, 0.14], scale: [0.16, 0.08, 0.06], meridians: ["Du Mai", "Stomaco", "Vescica"], geometry: "box" },
  { id: "temple_l", name: "Tempia sinistra", description: "Taiyang, GB8", position: [-0.17, 1.68, 0.08], scale: [0.05, 0.05, 0.05], meridians: ["Vescica Biliare", "Triplice Riscaldatore"], geometry: "sphere" },
  { id: "temple_r", name: "Tempia destra", description: "Taiyang, GB8", position: [0.17, 1.68, 0.08], scale: [0.05, 0.05, 0.05], meridians: ["Vescica Biliare", "Triplice Riscaldatore"], geometry: "sphere" },
  { id: "jaw_l", name: "Mandibola sinistra", description: "ST6 (Jiache), zona ATM", position: [-0.12, 1.55, 0.08], scale: [0.06, 0.04, 0.04], meridians: ["Stomaco", "Intestino Crasso"], geometry: "sphere" },
  { id: "jaw_r", name: "Mandibola destra", description: "ST6 (Jiache), zona ATM", position: [0.12, 1.55, 0.08], scale: [0.06, 0.04, 0.04], meridians: ["Stomaco", "Intestino Crasso"], geometry: "sphere" },
  { id: "occiput", name: "Occipite", description: "GB20 (Fengchi), BL10", position: [0, 1.7, -0.14], scale: [0.14, 0.1, 0.06], meridians: ["Vescica Biliare", "Vescica", "Du Mai"], geometry: "box" },

  // Neck
  { id: "neck_front", name: "Collo anteriore", description: "CV22 (Tiantu), zona tiroidea", position: [0, 1.42, 0.08], scale: [0.08, 0.08, 0.06], meridians: ["Ren Mai (Vaso Concezione)", "Stomaco"], geometry: "capsule" },
  { id: "neck_back", name: "Collo posteriore", description: "GV14 (Dazhui), cervicale", position: [0, 1.42, -0.08], scale: [0.08, 0.08, 0.06], meridians: ["Du Mai", "Vescica", "Intestino Tenue"], geometry: "capsule" },

  // Shoulders
  { id: "shoulder_l", name: "Spalla sinistra", description: "LI15, GB21 (Jianjing)", position: [-0.28, 1.32, 0], scale: [0.1, 0.06, 0.08], meridians: ["Intestino Crasso", "Vescica Biliare", "Triplice Riscaldatore"], geometry: "sphere" },
  { id: "shoulder_r", name: "Spalla destra", description: "LI15, GB21 (Jianjing)", position: [0.28, 1.32, 0], scale: [0.1, 0.06, 0.08], meridians: ["Intestino Crasso", "Vescica Biliare", "Triplice Riscaldatore"], geometry: "sphere" },

  // Chest
  { id: "chest_upper", name: "Torace superiore", description: "CV17 (Shanzhong), zona sternale", position: [0, 1.22, 0.1], scale: [0.2, 0.08, 0.06], meridians: ["Ren Mai", "Polmone", "Cuore"], geometry: "box" },
  { id: "chest_l", name: "Torace sinistro", description: "Zona costale sinistra, LU1", position: [-0.15, 1.12, 0.08], scale: [0.1, 0.1, 0.06], meridians: ["Polmone", "Milza"], geometry: "box" },
  { id: "chest_r", name: "Torace destro", description: "Zona costale destra", position: [0.15, 1.12, 0.08], scale: [0.1, 0.1, 0.06], meridians: ["Polmone", "Fegato"], geometry: "box" },

  // Back
  { id: "upper_back", name: "Dorso superiore", description: "BL11-BL15, zona dorsale", position: [0, 1.22, -0.1], scale: [0.22, 0.12, 0.06], meridians: ["Vescica", "Du Mai", "Intestino Tenue"], geometry: "box" },
  { id: "mid_back", name: "Dorso medio", description: "BL18-BL21, zona lombo-dorsale", position: [0, 1.0, -0.1], scale: [0.2, 0.1, 0.06], meridians: ["Vescica", "Du Mai"], geometry: "box" },
  { id: "lower_back", name: "Zona lombare", description: "BL23 (Shenshu), GV4 (Mingmen)", position: [0, 0.82, -0.1], scale: [0.2, 0.1, 0.06], meridians: ["Vescica", "Du Mai", "Rene"], geometry: "box" },

  // Abdomen
  { id: "epigastrium", name: "Epigastrio", description: "CV12 (Zhongwan), zona gastrica", position: [0, 1.02, 0.1], scale: [0.14, 0.08, 0.06], meridians: ["Ren Mai", "Stomaco", "Milza"], geometry: "box" },
  { id: "umbilical", name: "Zona ombelicale", description: "CV8 (Shenque), ST25 (Tianshu)", position: [0, 0.9, 0.12], scale: [0.16, 0.08, 0.06], meridians: ["Ren Mai", "Stomaco", "Intestino Crasso"], geometry: "box" },
  { id: "lower_abdomen", name: "Ipogastrio", description: "CV4 (Guanyuan), CV6 (Qihai)", position: [0, 0.78, 0.12], scale: [0.16, 0.08, 0.06], meridians: ["Ren Mai", "Rene", "Fegato"], geometry: "box" },
  { id: "flank_l", name: "Fianco sinistro", description: "GB26, zona ipocondrio sx", position: [-0.2, 0.95, 0.04], scale: [0.06, 0.1, 0.08], meridians: ["Vescica Biliare", "Fegato"], geometry: "box" },
  { id: "flank_r", name: "Fianco destro", description: "GB26, zona ipocondrio dx", position: [0.2, 0.95, 0.04], scale: [0.06, 0.1, 0.08], meridians: ["Vescica Biliare", "Fegato"], geometry: "box" },

  // Arms
  { id: "upper_arm_l", name: "Braccio sinistro", description: "LI11 (Quchi), meridiano intestino crasso", position: [-0.38, 1.12, 0], scale: [0.06, 0.14, 0.06], meridians: ["Intestino Crasso", "Polmone", "Cuore"], geometry: "capsule" },
  { id: "upper_arm_r", name: "Braccio destro", description: "LI11 (Quchi)", position: [0.38, 1.12, 0], scale: [0.06, 0.14, 0.06], meridians: ["Intestino Crasso", "Polmone", "Cuore"], geometry: "capsule" },
  { id: "forearm_l", name: "Avambraccio sinistro", description: "PC6 (Neiguan), LI4 (Hegu)", position: [-0.42, 0.88, 0.04], scale: [0.05, 0.12, 0.05], meridians: ["Pericardio", "Intestino Crasso", "Triplice Riscaldatore"], geometry: "capsule" },
  { id: "forearm_r", name: "Avambraccio destro", description: "PC6 (Neiguan), LI4 (Hegu)", position: [0.42, 0.88, 0.04], scale: [0.05, 0.12, 0.05], meridians: ["Pericardio", "Intestino Crasso", "Triplice Riscaldatore"], geometry: "capsule" },
  { id: "hand_l", name: "Mano sinistra", description: "LI4, HT7, SI3", position: [-0.44, 0.72, 0.06], scale: [0.04, 0.06, 0.03], meridians: ["Intestino Crasso", "Cuore", "Intestino Tenue", "Polmone"], geometry: "box" },
  { id: "hand_r", name: "Mano destra", description: "LI4, HT7, SI3", position: [0.44, 0.72, 0.06], scale: [0.04, 0.06, 0.03], meridians: ["Intestino Crasso", "Cuore", "Intestino Tenue", "Polmone"], geometry: "box" },

  // Pelvis & Hip
  { id: "sacrum", name: "Sacro", description: "GV2, BL31-34 (punti Baliao)", position: [0, 0.68, -0.08], scale: [0.16, 0.08, 0.06], meridians: ["Du Mai", "Vescica"], geometry: "box" },
  { id: "hip_l", name: "Anca sinistra", description: "GB30 (Huantiao)", position: [-0.18, 0.65, -0.02], scale: [0.08, 0.06, 0.08], meridians: ["Vescica Biliare", "Vescica"], geometry: "sphere" },
  { id: "hip_r", name: "Anca destra", description: "GB30 (Huantiao)", position: [0.18, 0.65, -0.02], scale: [0.08, 0.06, 0.08], meridians: ["Vescica Biliare", "Vescica"], geometry: "sphere" },

  // Legs
  { id: "thigh_l", name: "Coscia sinistra", description: "ST34, GB31", position: [-0.14, 0.45, 0.02], scale: [0.08, 0.16, 0.08], meridians: ["Stomaco", "Vescica Biliare", "Milza"], geometry: "capsule" },
  { id: "thigh_r", name: "Coscia destra", description: "ST34, GB31", position: [0.14, 0.45, 0.02], scale: [0.08, 0.16, 0.08], meridians: ["Stomaco", "Vescica Biliare", "Milza"], geometry: "capsule" },
  { id: "knee_l", name: "Ginocchio sinistro", description: "ST36 (Zusanli), SP9", position: [-0.14, 0.28, 0.04], scale: [0.07, 0.06, 0.07], meridians: ["Stomaco", "Milza", "Vescica"], geometry: "sphere" },
  { id: "knee_r", name: "Ginocchio destro", description: "ST36 (Zusanli), SP9", position: [0.14, 0.28, 0.04], scale: [0.07, 0.06, 0.07], meridians: ["Stomaco", "Milza", "Vescica"], geometry: "sphere" },
  { id: "lower_leg_l", name: "Gamba sinistra", description: "SP6 (Sanyinjiao), GB34", position: [-0.13, 0.12, 0.02], scale: [0.05, 0.12, 0.05], meridians: ["Milza", "Fegato", "Rene", "Vescica Biliare"], geometry: "capsule" },
  { id: "lower_leg_r", name: "Gamba destra", description: "SP6 (Sanyinjiao), GB34", position: [0.13, 0.12, 0.02], scale: [0.05, 0.12, 0.05], meridians: ["Milza", "Fegato", "Rene", "Vescica Biliare"], geometry: "capsule" },
  { id: "ankle_l", name: "Caviglia sinistra", description: "KI3, SP6, BL60", position: [-0.13, -0.02, 0.02], scale: [0.05, 0.04, 0.05], meridians: ["Rene", "Milza", "Vescica"], geometry: "sphere" },
  { id: "ankle_r", name: "Caviglia destra", description: "KI3, SP6, BL60", position: [0.13, -0.02, 0.02], scale: [0.05, 0.04, 0.05], meridians: ["Rene", "Milza", "Vescica"], geometry: "sphere" },
  { id: "foot_l", name: "Piede sinistro", description: "KI1 (Yongquan), LR3 (Taichong)", position: [-0.13, -0.1, 0.06], scale: [0.05, 0.03, 0.08], meridians: ["Rene", "Fegato", "Stomaco", "Vescica Biliare"], geometry: "box" },
  { id: "foot_r", name: "Piede destro", description: "KI1 (Yongquan), LR3 (Taichong)", position: [0.13, -0.1, 0.06], scale: [0.05, 0.03, 0.08], meridians: ["Rene", "Fegato", "Stomaco", "Vescica Biliare"], geometry: "box" },
];

// Acupuncture points database for visualization on the 3D model
export interface AcuPoint {
  id: string;
  name: string;
  chineseName: string;
  meridian: string;
  position: [number, number, number];
  indications: string;
}

export const ACUPOINTS: AcuPoint[] = [
  // Head
  { id: "GV20", name: "Baihui", chineseName: "百会", meridian: "Du Mai", position: [0, 1.9, 0], indications: "Cefalea vertex, vertigini, insonnia" },
  { id: "GB20", name: "Fengchi", chineseName: "风池", meridian: "Vescica Biliare", position: [-0.1, 1.7, -0.16], indications: "Cefalea occipitale, rigidità cervicale" },
  { id: "GB20R", name: "Fengchi dx", chineseName: "风池", meridian: "Vescica Biliare", position: [0.1, 1.7, -0.16], indications: "Cefalea occipitale, rigidità cervicale" },
  
  // Neck & Shoulder
  { id: "GB21", name: "Jianjing", chineseName: "肩井", meridian: "Vescica Biliare", position: [-0.2, 1.35, -0.02], indications: "Dolore spalla, tensione trapezio" },
  { id: "GB21R", name: "Jianjing dx", chineseName: "肩井", meridian: "Vescica Biliare", position: [0.2, 1.35, -0.02], indications: "Dolore spalla, tensione trapezio" },
  { id: "GV14", name: "Dazhui", chineseName: "大椎", meridian: "Du Mai", position: [0, 1.38, -0.1], indications: "Febbre, rigidità cervicale, punto immunostimolante" },

  // Upper limb
  { id: "LI4", name: "Hegu", chineseName: "合谷", meridian: "Intestino Crasso", position: [-0.44, 0.74, 0.06], indications: "Cefalea, dolore facciale, immunità" },
  { id: "LI4R", name: "Hegu dx", chineseName: "合谷", meridian: "Intestino Crasso", position: [0.44, 0.74, 0.06], indications: "Cefalea, dolore facciale, immunità" },
  { id: "LI11", name: "Quchi", chineseName: "曲池", meridian: "Intestino Crasso", position: [-0.4, 1.0, 0.04], indications: "Dolore gomito, febbre, ipertensione" },
  { id: "PC6", name: "Neiguan", chineseName: "内关", meridian: "Pericardio", position: [-0.42, 0.82, 0.06], indications: "Nausea, ansia, palpitazioni, dolore toracico" },

  // Trunk
  { id: "CV17", name: "Shanzhong", chineseName: "膻中", meridian: "Ren Mai", position: [0, 1.2, 0.14], indications: "Oppressione toracica, dispnea, mastite" },
  { id: "CV12", name: "Zhongwan", chineseName: "中脘", meridian: "Ren Mai", position: [0, 1.02, 0.15], indications: "Gastralgia, nausea, disturbi digestivi" },
  { id: "CV4", name: "Guanyuan", chineseName: "关元", meridian: "Ren Mai", position: [0, 0.78, 0.15], indications: "Tonificazione Qi/Yang, dismenorrea, astenia" },
  { id: "ST25", name: "Tianshu", chineseName: "天枢", meridian: "Stomaco", position: [-0.08, 0.9, 0.15], indications: "Dolore addominale, stipsi, diarrea" },
  { id: "ST25R", name: "Tianshu dx", chineseName: "天枢", meridian: "Stomaco", position: [0.08, 0.9, 0.15], indications: "Dolore addominale, stipsi, diarrea" },

  // Back
  { id: "BL23", name: "Shenshu", chineseName: "肾俞", meridian: "Vescica", position: [-0.06, 0.82, -0.14], indications: "Lombalgia, deficit di Rene, tinnito" },
  { id: "BL23R", name: "Shenshu dx", chineseName: "肾俞", meridian: "Vescica", position: [0.06, 0.82, -0.14], indications: "Lombalgia, deficit di Rene, tinnito" },
  { id: "GV4", name: "Mingmen", chineseName: "命门", meridian: "Du Mai", position: [0, 0.84, -0.14], indications: "Lombalgia, deficit Yang di Rene" },

  // Lower limb
  { id: "ST36", name: "Zusanli", chineseName: "足三里", meridian: "Stomaco", position: [-0.16, 0.22, 0.08], indications: "Tonificazione generale, disturbi gastrici" },
  { id: "ST36R", name: "Zusanli dx", chineseName: "足三里", meridian: "Stomaco", position: [0.16, 0.22, 0.08], indications: "Tonificazione generale, disturbi gastrici" },
  { id: "SP6", name: "Sanyinjiao", chineseName: "三阴交", meridian: "Milza", position: [-0.15, 0.04, 0.04], indications: "Dismenorrea, insonnia, deficit di Sangue" },
  { id: "SP6R", name: "Sanyinjiao dx", chineseName: "三阴交", meridian: "Milza", position: [0.15, 0.04, 0.04], indications: "Dismenorrea, insonnia, deficit di Sangue" },
  { id: "GB34", name: "Yanglingquan", chineseName: "阳陵泉", meridian: "Vescica Biliare", position: [-0.17, 0.2, 0.02], indications: "Dolore ginocchio, tendini, ipocondrio" },
  { id: "KI3", name: "Taixi", chineseName: "太溪", meridian: "Rene", position: [-0.15, -0.02, -0.02], indications: "Deficit Rene, lombalgia, tinnito, insonnia" },
  { id: "LR3", name: "Taichong", chineseName: "太冲", meridian: "Fegato", position: [-0.14, -0.1, 0.1], indications: "Stasi di Qi Fegato, cefalea, irritabilità" },
  { id: "LR3R", name: "Taichong dx", chineseName: "太冲", meridian: "Fegato", position: [0.14, -0.1, 0.1], indications: "Stasi di Qi Fegato, cefalea, irritabilità" },
  { id: "BL60", name: "Kunlun", chineseName: "昆仑", meridian: "Vescica", position: [-0.16, -0.02, -0.04], indications: "Lombalgia, cervicalgia, dolore caviglia" },
  { id: "KI1", name: "Yongquan", chineseName: "涌泉", meridian: "Rene", position: [-0.13, -0.12, 0.08], indications: "Emergenze, perdita di coscienza, ansia" },
];
