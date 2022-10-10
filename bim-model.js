import { projects } from "./projects.js";
import { 
    Color, 
    LineBasicMaterial, 
    MeshBasicMaterial,
  } from 'three';
  import { IfcViewerAPI } from 'web-ifc-viewer';
  import {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCDOOR,
    IFCWINDOW,
    IFCFURNISHINGELEMENT,
    IFCMEMBER,
    IFCPLATE,
    IFCCURTAINWALL
  } from 'web-ifc';
  import Drawing from 'dxf-writer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(255, 255, 255)});
viewer.axes.setAxes();
viewer.grid.setGrid();

const scene = viewer.context.getScene();
let model;
let allPlans;

loadIfc();
async function loadIfc() {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const currentProjectID = url.searchParams.get('id');
  const currentProject = projects.find(project => project.id === currentProjectID);
  viewer.IFC.setWasmPath('../');
  model = await viewer.IFC.loadIfcUrl(currentProject.url);
  await viewer.shadowDropper.renderShadow(model.modelID);

  // For checkboxes
  model.removeFromParent();
  togglePickable(model, false);
  await setupAllCategories();

  await viewer.plans.computeAllPlanViews(model.modelID);
  const lineMaterial = new LineBasicMaterial({color: 'black'});
  const baseMaterial = new MeshBasicMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1  
  });
  viewer.edges.create('example-edges', model.modelID, lineMaterial, baseMaterial);

  const containerForPlans = document.getElementById('button-container');
  allPlans = viewer.plans.getAll(model.modelID);
  for(const plan of allPlans) {
    const currentPlan = viewer.plans.planLists[model.modelID][plan];

    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = currentPlan.name;
    button.onclick = () => {
      viewer.plans.goTo(model.modelID, plan);
      viewer.edges.toggle('example-edges', true);
      toggleShadow(false);
    };
  };

  const button = document.createElement('button');
  containerForPlans.appendChild(button);
  button.textContent = 'Exit floorplans';
  button.onclick = () => {
    viewer.plans.exitPlanView();
    viewer.edges.toggle('example-edges', false);
    toggleShadow(true);
  };

  // For floorplan export
  const projectFloorplan = await viewer.IFC.getSpatialStructure(model.modelID);
  const storeys = projectFloorplan.children[0].children[0].children;
  for(const storey of storeys) {
    for(const child of storey.children) {
      if(child.children.length) {
        storey.children.push(...child.children);
      };
    };
  };

  viewer.dxf.initializeJSDXF(Drawing);

  for (plan of allPlans) {
    const currentPlan = viewer.plans.planLists[model.modelID][plan];
    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = 'Export ' + currentPlan.name;
    button.onclick = () => {
      const storey = storeys.find(storey => storey.expressID === currentPlan.expressID);
      exportDXF(storey, currentPlan, model.modelID);
    };
  };
};

// Action buttons collection
const allActionButtons = [];
console.log(allActionButtons);

// Back button
const backButton = document.getElementById('back-button');
backButton.onclick = () => {
  window.location.href='./index.html';
};

// Selection button
const selectButton = document.getElementById('select-button');
allActionButtons.push(selectButton);

let selectionActive = false;
let propertiesMenu
selectButton.onclick = () => {
  if(selectionActive) {
    selectionActive = !selectionActive;
    selectButton.classList.remove('active');
    window.onmousemove = () => {
      viewer.IFC.selector.unPrepickIfcItems();
    };
    viewer.IFC.selector.unHighlightIfcItems();
    removeAllChildren(propsGUI);
    propertiesMenu.classList.remove('visible');
  } else {
    selectionActive = !selectionActive;
    selectButton.classList.add('active');
    selectionActive = window.onmousemove = () => {
      viewer.IFC.selector.prePickIfcItem();
    };
    propertiesMenu = document.getElementById('ifc-property-menu');
    propertiesMenu.classList.add('visible');
  };
};

// Dimensions button
const measureButton = document.getElementById('measure-button');
allActionButtons.push(measureButton);

let measuresActive = false;
measureButton.onclick = () => {
  if(measuresActive) {
    measuresActive = !measuresActive;
    measureButton.classList.remove('active');
    viewer.dimensions.deleteAll();
    viewer.dimensions.previewActive = measuresActive;
  } else {
    measuresActive = !measuresActive;
    measureButton.classList.add('active');
    viewer.dimensions.active = measuresActive;
    viewer.dimensions.previewActive = measuresActive;
  };
};

// Floorplans button
const floorplanButton = document.getElementById('floorplans-button');
allActionButtons.push(floorplanButton);

let floorplansActive = false;
let floorplansButtonContainer
floorplanButton.onclick = () => {
  if(floorplansActive) {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.remove('active');
    floorplansButtonContainer.classList.remove('visible');
    viewer.plans.exitPlanView();
    viewer.edges.toggle('example-edges', false);
    toggleShadow(true);
  } else {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.add('active');
    floorplansButtonContainer = document.getElementById('button-container');
    floorplansButtonContainer.classList.add('visible');
  };
};

// Cutting button
const cutButton = document.getElementById('cut-button');
allActionButtons.push(cutButton);

let cuttingPlansActive = false;
cutButton.onclick = () => {
  if(cuttingPlansActive) {
    cuttingPlansActive = !cuttingPlansActive;
    cutButton.classList.remove('active');
    viewer.clipper.deleteAllPlanes();
  } else {
    cuttingPlansActive = !cuttingPlansActive;
    cutButton.classList.add('active');
    viewer.clipper.active = cuttingPlansActive;
  };
};

// Hide button
const hideButton = document.getElementById('hide-button');
const checkBoxes = document.getElementById('checkboxes');
allActionButtons.push(hideButton);

let hidingActive = false;
hideButton.onclick = async () => {
  if(hidingActive) {
    hidingActive = !hidingActive;
    hideButton.classList.remove('active');
    checkBoxes.classList.remove('visible');
    togglePickable(model, true);
    await setupAllCategories();
    const elementsWithIfcId = document.querySelectorAll(`[id^="IFC"]`);
    for (let i = 0; i < elementsWithIfcId.length; i++) {
      elementsWithIfcId[i].checked = true;
    };
    updatePostproduction();
  } else {
    hidingActive = !hidingActive;
    hideButton.classList.add('active');
    checkBoxes.classList.add('visible');
  };
};

// Escape click for all buttons
window.onkeydown = async (event) => {
  if(event.code === 'Escape' && cuttingPlansActive) {
    viewer.clipper.deleteAllPlanes();
    cuttingPlansActive = !cuttingPlansActive;
    cutButton.classList.remove('active');
  } else if(event.code === 'Escape' && measuresActive) {
    measuresActive = !measuresActive;
    measureButton.classList.remove('active');
    viewer.dimensions.previewActive = measuresActive;
    viewer.dimensions.deleteAll();
  } else if(event.code === 'Escape' && selectionActive) {
    selectButton.classList.remove('active');
    selectionActive = !selectionActive;
    window.onmousemove = () => {
      viewer.IFC.selector.unPrepickIfcItems();
    };
    viewer.IFC.selector.unHighlightIfcItems();
    removeAllChildren(propsGUI);
    propertiesMenu.classList.remove('visible');
  } else if(event.code === 'Escape' && hidingActive) {
    hidingActive = !hidingActive;
    hideButton.classList.remove('active');
    checkBoxes.classList.remove('visible');
    togglePickable(model, true);
    await setupAllCategories();
    const elementsWithIfcId = document.querySelectorAll(`[id^="IFC"]`);
    for (let i = 0; i < elementsWithIfcId.length; i++) {
      elementsWithIfcId[i].checked = true;
    };
    updatePostproduction();
  } else if(event.code === 'Escape' && floorplansActive) {
    viewer.plans.exitPlanView();
    
    
    floorplanButton.classList.remove('active');
    floorplansButtonContainer.classList.remove('visible');

    viewer.edges.toggle('example-edges', false);
    toggleShadow(true);
    floorplansActive = !floorplansActive;
    
  }  
};

// Double click for all buttons
window.ondblclick = async () => {
  if(cuttingPlansActive) {
    viewer.clipper.createPlane();
  } else if(measuresActive) {
      viewer.dimensions.create();
  } else if(selectionActive) {
    const result = await viewer.IFC.selector.highlightIfcItem();
    if(!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    createPropertiesMenu(props);
  // } else if(hidingActive) {
  //   const result = viewer.context.castRayIfc();
  //   const index = result.faceIndex;
  //   const subset = result.object;
  //   const id = viewer.IFC.loader.ifcManager.getExpressId(subset.geometry, index);
  //   if(result === null) return;
  //   viewer.IFC.loader.ifcManager.removeFromSubset(
  //     subset.modelID,
  //     [id],
  //     subset.userData.category
  //   );
  //   updatePostproduction();
  }
};

// Functions for selection
const propsGUI = document.getElementById('ifc-property-menu-root');

function createPropertiesMenu(properties) {
  console.log(properties);

  removeAllChildren(propsGUI);

  delete properties.psets;
  delete properties.mats;
  delete properties.type;

  for(let key in properties) {
    createPropertyEntry(key, properties[key]);
  };
};

function createPropertyEntry(key, value) {
  const propContainer = document.createElement("div");
  propContainer.classList.add("ifc-property-item");

  if(value === null || value === undefined) value = "undefined";
  else if(value.value) value = value.value;

  const keyElement = document.createElement("div");
  keyElement.textContent = key;
  propContainer.appendChild(keyElement);

  const valueElement = document.createElement("div");
  valueElement.classList.add("ifc-property-value");
  valueElement.textContent = value;
  propContainer.appendChild(valueElement);

  propsGUI.appendChild(propContainer);
};

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  };
};

// Functions for checkboxes
const categories = {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCDOOR,
  IFCWINDOW,
  IFCFURNISHINGELEMENT,
  IFCMEMBER,
  IFCPLATE,
  IFCCURTAINWALL
};

function getName(category) {
  const names = Object.keys(categories);
  return names.find(name => categories[name] === category);
};

async function getAll(category) {
  return viewer.IFC.loader.ifcManager.getAllItemsOfType(model.modelID, category);
};

const subsets = {};

async function setupAllCategories() {
  const allCategories = Object.values(categories);
  for(const category of allCategories) {
    await setupCategory(category);
  };
};

async function setupCategory(category) {
  const subset = await newSubsetOfType(category);
  subset.userData.category = category.toString();
  subsets[category] = subset;
  togglePickable(subset, true);
  setupCheckbox(category);
};

function setupCheckbox(category) {
  const name = getName(category);
  const checkbox = document.getElementById(name);
  checkbox.addEventListener('change', () => {
    const subset = subsets[category];
    if(checkbox.checked) {
      scene.add(subset);
      togglePickable(subset, true);
    }
    else {
      subset.removeFromParent();
      togglePickable(subset, false);
    };
    updatePostproduction();
  });
};

function updatePostproduction() {
  viewer.context.renderer.postProduction.update();
};

async function newSubsetOfType(category) {
  const ids = await getAll(category);
  return viewer.IFC.loader.ifcManager.createSubset({
    modelID: model.modelID,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString()
  });
};

function togglePickable(mesh, isPickable) {
  const pickableModels = viewer.context.items.pickableIfcModels;
  if(isPickable) {
    pickableModels.push(mesh);
  } else {
    const index = pickableModels.indexOf(mesh);
    pickableModels.splice(index, 1);
  };
};

// Functions for floorplans
const dummySubsetMaterial = new MeshBasicMaterial({visible: false});
async function exportDXF(storey, plan, modelID) {
  if(!viewer.dxf.drawings[plan.name]) {
    viewer.dxf.newDrawing(plan.name)
  };
  
  const ids = storey.children.map(item => item.expressID);
  if(!ids) return;

  const subset = viewer.IFC.loader.ifcManager.createSubset({
    modelID,
    ids,
    removePrevious: true,
    customID: 'floor_plan_generation',
    material: dummySubsetMaterial
  });

  const filteredPoints = [];
  const edges = await viewer.edgesProjector.projectEdges(subset);
  const positions = edges.geometry.attributes.position.array;

  const tolerance = 0.001;
  for(let i = 0; i < positions.length - 5; i += 6) {
    const a = positions[i] - positions[i + 3];
		const b = -positions[i + 2] + positions[i + 5];

		const distance = Math.sqrt(a * a + b * b);

		if (distance > tolerance) {
			filteredPoints.push([positions[i], -positions[i + 2], positions[i + 3], -positions[i + 5]]);
		}
  };

  viewer.dxf.drawEdges(plan.name, filteredPoints, 'Projection', Drawing.ACI.BLUE, 'CONTINOUS');
  edges.geometry.dispose();

  viewer.dxf.drawNamedLayer(plan.name, plan, 'thick', 'Section', Drawing.ACI.RED, 'CONTINOUS');
  viewer.dxf.drawNamedLayer(plan.name, plan, 'thin', 'Section', Drawing.ACI.RED, 'CONTINOUS');

  const result = viewer.dxf.exportDXF(plan.name);
  const link = document.createElement('a');
  link.download = 'floorplan.dxf';
  link.href = URL.createObjectURL(result);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

function toggleShadow(active) {
  const shadows = Object.values(viewer.shadowDropper.shadows);
  for(shadow of shadows) {
    shadow.root.visible = active;
  };
};