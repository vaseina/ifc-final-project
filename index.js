import { projects } from "./projects.js";

const projectList = document.getElementById("project-list");
const projectCards = Array.from(projectList.children);
const exampleCard = projectCards[0];

const baseURL = './bim-model.html';

for(let project of projects) {
    const newCard = exampleCard.cloneNode(true);

    const button = newCard.querySelector('a');
    button.href = baseURL + `?id=${project.id}`;
    button.classList.add(`img-${project.name}`);

    projectList.appendChild(newCard);
}

exampleCard.remove();