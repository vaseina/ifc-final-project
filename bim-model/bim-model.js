import { projects } from "./projects.js";

const currentUrl = window.location.href; 
const url = new URL(currentUrl);
const currentProjectID = url.searchParams.get("id");
const currentProject = projects.find(project => 
    project.id === currentProjectID);

const iframe = document.getElementById('model-iframe');
iframe.src = currentProject.url;