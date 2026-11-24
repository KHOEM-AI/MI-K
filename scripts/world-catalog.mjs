// Catalog of everything that can be exported as its own .glb file.
// One line per object: [category, name, source file, factory function, arguments].
// To add an object: add one line here. Nothing else needs to change.
// Paths are relative to src/ (the same folders the app already uses).

export const CATALOG = [
  // ---- houses and buildings ----
  ["houses", "poor-house", "components/villageGeometry.ts", "createPoorHouse", []],
  ["houses", "middle-house", "components/villageGeometry.ts", "createMiddleHouse", []],
  ["houses", "rich-house", "components/villageGeometry.ts", "createRichHouse", []],
  ["houses", "village-houses", "components/villageGeometry.ts", "createVillageHousesInstanced", [300, 42, 34]],
  ["buildings", "village-school", "components/villageCivic.ts", "createVillageSchool", []],
  ["buildings", "village-clinic", "components/villageCivic.ts", "createVillageClinic", []],
  ["buildings", "school-building", "components/schoolGeometry.ts", "createSchoolBuilding", []],
  ["buildings", "hospital", "components/hospitalGeometry.ts", "createHospitalBuilding", []],
  ["buildings", "meat-veg-factory", "components/villageGeometry.ts", "createMeatVegFactory", []],
  ["buildings", "phone-shop", "components/villageGeometry.ts", "createPhoneShop", []],
  ["buildings", "clothing-shop", "components/villageGeometry.ts", "createClothingShop", []],
  ["buildings", "motorbike-shop", "components/villageGeometry.ts", "createMotorbikeShop", []],
  ["buildings", "bike-shop", "components/villageGeometry.ts", "createBikeShop", []],
  ["buildings", "market-stall", "components/villageGeometry.ts", "createMarketStall", []],

  // ---- roads, ground and village furniture ----
  ["roads", "village-roads", "components/villageGeometry.ts", "createVillageRoads", []],
  ["roads", "village-ground", "components/villageGeometry.ts", "createVillageGround", []],
  ["roads", "street-lamps", "components/villageGeometry.ts", "createStreetLamps", []],
  ["roads", "bridge", "components/natureElements.ts", "createBridge", []],
  ["roads", "winding-road", "components/natureElements.ts", "createWindingRoad", [[[-40, 0, 0], [-10, 0, 20], [20, 0, -10], [50, 0, 10]], 6]],
  ["school", "flag-pole", "components/schoolGeometry.ts", "createFlagPole", []],
  ["school", "school-surroundings", "components/villageGeometry.ts", "createSchoolSurroundings", []],
  ["school", "hospital-surroundings", "components/villageGeometry.ts", "createHospitalSurroundings", []],
  ["school", "hospital-bed", "components/hospitalGeometry.ts", "createHospitalBed", []],
  ["school", "bench", "components/hospitalGeometry.ts", "createBench", []],

  // ---- vehicles ----
  ["vehicles", "car", "components/villageGeometry.ts", "createCar", []],
  ["vehicles", "motorbike", "components/villageGeometry.ts", "createMotorbike", []],
  ["vehicles", "bicycle", "components/villageGeometry.ts", "createBicycle", []],
  ["vehicles", "village-car", "components/vehicleModels.ts", "createVehicle", ["car", "#2d6cdf"]],
  ["vehicles", "village-moto", "components/vehicleModels.ts", "createVehicle", ["moto", "#c0392b"]],
  ["vehicles", "village-bicycle", "components/vehicleModels.ts", "createVehicle", ["bicycle", "#27ae60"]],
  ["vehicles", "ambulance", "components/hospitalGeometry.ts", "createAmbulance", []],
  ["vehicles", "helicopter", "components/helicopter.ts", "createHelicopter", []],

  // ---- animals: village ----
  ["animals", "cow", "components/villageAnimals.ts", "createCow", []],
  ["animals", "pig", "components/villageAnimals.ts", "createPig", []],
  ["animals", "duck", "components/villageAnimals.ts", "createDuck", []],
  ["animals", "chicken", "components/natureElements.ts", "createChicken", []],
  ["animals", "guard-dog", "components/guardDogs.ts", "createGuardDog", []],
  // ---- animals: wild ----
  ["animals", "tiger", "components/wildAnimals.ts", "createTiger", []],
  ["animals", "elephant", "components/wildAnimals.ts", "createElephant", []],
  ["animals", "monkey", "components/wildAnimals.ts", "createMonkey", []],
  ["animals", "snake", "components/wildAnimals.ts", "createSnake", []],
  ["animals", "wild-bird", "components/wildAnimals.ts", "createWildBird", []],
  ["animals", "porcupine", "components/forestWildlife.ts", "createPorcupine", []],
  ["animals", "banteng", "components/forestWildlife.ts", "createBanteng", []],
  ["animals", "wild-boar", "components/forestWildlife.ts", "createWildBoar", []],
  ["animals", "elds-deer", "components/forestWildlife.ts", "createEldsDeer", []],
  ["animals", "bear", "components/forestWildlife.ts", "createBear", []],
  ["animals", "rhinoceros", "components/forestWildlife.ts", "createRhinoceros", []],
  ["animals", "crocodile", "components/forestWildlife.ts", "createCrocodile", []],
  // ---- animals: sea ----
  ["animals", "manta-ray", "components/marineLife.ts", "createMantaRay", []],
  ["animals", "shark", "components/marineLife.ts", "createShark", []],
  ["animals", "dolphin", "components/marineLife.ts", "createDolphin", []],
  ["animals", "sea-turtle", "components/marineLife.ts", "createSeaTurtle", []],
  ["animals", "fish-school", "components/marineLife.ts", "createFishSchool", []],

  // ---- people ----
  ["people", "student", "components/schoolGeometry.ts", "createStudent", [0x3b82f6]],
  ["people", "teacher", "components/schoolGeometry.ts", "createTeacher", []],
  ["people", "doctor", "components/hospitalGeometry.ts", "createDoctor", []],
  ["people", "nurse", "components/hospitalGeometry.ts", "createNurse", []],
  ["people", "patient", "components/hospitalGeometry.ts", "createPatient", []],
  ["people", "villager-farmer", "components/villageLife.ts", "createVillager", ["#3498db", "farmer"]],
  ["people", "villager-market", "components/villageLife.ts", "createVillager", ["#e67e22", "market"]],
  ["people", "villager-shopkeeper", "components/villageLife.ts", "createVillager", ["#16a085", "shopkeeper"]],
  ["people", "villager-elder", "components/villageLife.ts", "createVillager", ["#8e44ad", "elder"]],
  ["people", "villager-student", "components/villageLife.ts", "createVillager", ["#ffffff", "student"]],
  ["people", "villager-teacher", "components/villageLife.ts", "createVillager", ["#dfe9f5", "teacher"]],
  ["people", "villager-medic", "components/villageLife.ts", "createVillager", ["#ffffff", "medic"]],

  // ---- farm, nature and tools ----
  ["farm", "rice-field", "components/villageGeometry.ts", "createRiceField", []],
  ["farm", "vegetable-garden", "components/villageGeometry.ts", "createVegetableGarden", []],
  ["farm", "mixed-farm", "components/natureElements.ts", "createMixedFarm", []],
  ["farm", "fish-pond", "components/natureElements.ts", "createFishPond", []],
  ["nature", "mountain", "components/natureElements.ts", "createMountain", []],
  ["nature", "lake", "components/natureElements.ts", "createLake", []],
  ["nature", "forest", "components/natureElements.ts", "createForest", []],
  ["nature", "tree-round", "components/natureElements.ts", "createTree", [1, "round"]],
  ["nature", "tree-pine", "components/natureElements.ts", "createTree", [1, "pine"]],
  ["nature", "tree-palm", "components/natureElements.ts", "createTree", [1, "palm"]],
  ["tools", "forklift", "components/moreMachines.ts", "createForklift", []],
  ["tools", "assembly-line", "components/moreMachines.ts", "createAssemblyLine", []],
  ["tools", "warehouse-shelves", "components/moreMachines.ts", "createWarehouseShelves", []],
];

export const NAME_OK = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** Returns a list of problems (empty list = the catalog is well formed). */
export function validateCatalog(catalog = CATALOG) {
  const problems = [], seen = new Set();
  for (const [category, name, file, fn, args] of catalog) {
    const id = `${category}/${name}`;
    if (!NAME_OK.test(category) || !NAME_OK.test(name)) problems.push(`${id}: unsafe name`);
    if (seen.has(id)) problems.push(`${id}: duplicate`);
    seen.add(id);
    if (!/^components\/[\w.]+\.ts$/.test(file)) problems.push(`${id}: bad file ${file}`);
    if (!/^create\w+$/.test(fn)) problems.push(`${id}: bad function ${fn}`);
    if (!Array.isArray(args)) problems.push(`${id}: args must be an array`);
  }
  return problems;
}
