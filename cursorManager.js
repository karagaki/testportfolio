// cursorManager.js

let activeProject = null;

export function setActiveProject(projectId) {
    activeProject = projectId;
    console.log('Active project set to:', projectId);
}

export function getActiveProject() {
    return activeProject;
}

export function initCursorManager() {
    console.log('Cursor manager initialized');
}