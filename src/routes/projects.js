// src/routes/projects.js
import { writable } from 'svelte/store';
import { storage, db } from '../firebase';
import { ref, push, update } from 'firebase/database';
import { getDownloadURL, uploadBytes } from 'firebase/storage';

const projects = writable([]);

async function uploadImage(file, progressCallback) {
  const storageRef = ref(storage, `project_images/${file.name}`);
  const uploadTask = uploadBytes(storageRef, file);

  uploadTask.on('state_changed', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    progressCallback(progress);
  });

  await uploadTask;
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

async function addProject(project) {
    try {
      const image = project.image;
      delete project.image;
  
      if (image) {
        project.imageURL = await uploadImage(image, (progress) => {
          project.uploadProgress = progress;
        });
      }
  
      const projectsRef = ref(db, 'projects');
      const newProjectRef = push(projectsRef);
      const newProjectKey = newProjectRef.key;
  
      await update(ref(db, `projects/${newProjectKey}`), { id: newProjectKey, ...project });
  
      projects.update((prev) => [...prev, { ...project, id: newProjectKey }]);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error; // Rethrow the error to propagate it to the caller
    }
  }

export { projects, addProject };
