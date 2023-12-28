<script>
  // Import statements
  import { onMount } from 'svelte';
  import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
  import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
  } from 'firebase/storage';
  import { push, ref as rtdbRef, set, getDatabase, onValue } from 'firebase/database';
  import Swal from 'sweetalert2';
  import { goto } from '@sapper/app';
  import firebaseApp from '../firebase';
  import Compressor from 'compressorjs'; // Import compressorjs library

  let istTime = '';
  let isEditMode = false;

  function updateClock() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };

    istTime = new Intl.DateTimeFormat('en-US', options).format(now);
  }

  onMount(() => {
    // Update the clock every second
    const interval = setInterval(updateClock, 1000);

    // Clean up the interval on component destroy
    return () => clearInterval(interval);

    // Initial update
    updateClock();
  });

  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);
  const db = getDatabase(firebaseApp);

  let project = {
    title: '',
    dmcaApproval: false,
    landApproval: false,
    buildUpArea: 0,
    unitType: '',
    lochighlight: '',
    highlight: '',
    projectStatus: '',
    landmark: '',
    images: [],
  };

  let storedData = [];
  let isSubmitting = false;

  onMount(() => {
    // Check if the user is authenticated
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        goto('/');
      }
    });

    // Update the clock every second
    const interval = setInterval(updateClock, 1000);

    // Cleanup function to clear the interval on component destroy
    const cleanup = () => clearInterval(interval);

    // Initial update
    updateClock();

    const dbRef = rtdbRef(db, 'projects');
    onValue(dbRef, (snapshot) => {
      storedData = [];
      snapshot.forEach((childSnapshot) => {
        storedData.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      console.log('Fetched data:', storedData);
      console.log('Data length:', storedData.length);
    });

    // Return the cleanup function
    return cleanup;
  });

  const handleLogout = async () => {
    await signOut(auth);
    goto('/');
  };

  const handleAddProject = async () => {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      // Form Validation
      if (!validateForm()) {
        throw new Error('Please fill out all required fields.');
      }

      const downloadURLs = [];

      // Compress and upload project images to Firebase Storage using compressorjs
      for (const file of project.images) {
        const compressedBlob = await compressImage(file);
        const fileName = `Projects/${project.title}/${getFormattedDate()}-${project.landmark.replace(
          /\s/g,
          ''
        )}-${file.name}`;
        const storageRefVar = storageRef(storage, fileName);
        await uploadBytes(storageRefVar, compressedBlob);
        const downloadURL = await getDownloadURL(storageRefVar);
        downloadURLs.push(downloadURL);
      }

      // Save project data to Firebase Realtime Database
      const dbRef = rtdbRef(db, 'projects');

      // If project has an ID, update the existing project
      if (project.id) {
        const projectRef = child(dbRef, project.id);
        await set(projectRef, { ...project, images: downloadURLs });
      } else {
        // If project doesn't have an ID, add a new project
        const newProjectRef = push(dbRef);
        await set(newProjectRef, { ...project, images: downloadURLs });
      }

      // Reset the form after successful upload
      project = {
        title: '',
        dmcaApproval: false,
        landApproval: false,
        buildUpArea: 0,
        unitType: '',
        lochighlight: '',
        highlight: '',
        projectStatus: '',
        landmark: '',
        images: [],
      };

      Swal.fire({
        icon: 'success',
        title: 'Project added/updated successfully!',
      });
    } catch (error) {
      console.error('Error adding/updating project:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error adding/updating project',
        text: error.message || 'Please try again.',
      });
    } finally {
      isSubmitting = false;
    }
  };


  const handleUpdateProject = async () => {
        // The code for updating a project goes here
        // Similar to the logic in handleAddProject
        // Ensure you perform the necessary validations, image uploads, and database updates
        try {
            // Form Validation
            if (!validateForm()) {
                throw new Error('Please fill out all required fields.');
            }

            const downloadURLs = [];

            // Upload project images to Firebase Storage
            for (const file of project.images) {
                const fileName = `Projects/${project.title}/${getFormattedDate()}-${project.landmark.replace(
                    /\s/g,
                    ''
                )}-${file.name}`;
                const storageRefVar = storageRef(storage, fileName);
                await uploadBytes(storageRefVar, file);
                const downloadURL = await getDownloadURL(storageRefVar);
                downloadURLs.push(downloadURL);
            }

            // Save project data to Firebase Realtime Database
            const dbRef = rtdbRef(db, 'projects');

            // If project has an ID, update the existing project
            const projectRef = child(dbRef, project.id);
            await set(projectRef, { ...project, images: downloadURLs });

            // Reset the form after successful update
            project = {
                title: '',
                dmcaApproval: false,
                landApproval: false,
                buildUpArea: 0,
                unitType: '',
                lochighlight: '',
                highlight : '',
                projectStatus: '',
                landmark: '',
                images: [],
            };

            // Exit edit mode
            isEditMode = false;

            Swal.fire({
                icon: 'success',
                title: 'Project updated successfully!',
            });
        } catch (error) {
            console.error('Error updating project:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error updating project',
                text: error.message || 'Please try again.',
            });
        } finally {
            isSubmitting = false;
        }
    };

  // Helper function to compress an image using compressorjs
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8, // Adjust quality as needed
        maxWidth: 800, // Adjust max width as needed
        maxHeight: 800, // Adjust max height as needed
        success(result) {
          resolve(result);
        },
        error(error) {
          reject(error);
        },
      });
    });
  };

  const getFormattedDate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
  };

  const handleEdit = async (id) => {
    // Implement edit functionality
    const projectToEdit = storedData.find((item) => item.id === id);

    // Populate the form with the data of the selected project
    project = { ...projectToEdit };

    // Enter edit mode
    isEditMode = true;
  };

  const handleDelete = async (id) => {
    // Implement delete functionality
    try {
      const dbRef = rtdbRef(db, 'projects');
      const projectRef = child(dbRef, id);
      await remove(projectRef);

      // Remove the deleted project from the storedData array
      storedData = storedData.filter((item) => item.id !== id);

      Swal.fire({
        icon: 'success',
        title: 'Project deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error deleting project',
        text: 'Please try again.',
      });
    }
  };

  const handleAction = (action, id) => {
    if (action === 'edit') {
      handleEdit(id);
    } else if (action === 'delete') {
      handleDelete(id);
    }
  };

  const validateForm = () => {
    return (
      project.title &&
      project.buildUpArea &&
      project.unitType &&
      project.projectStatus &&
      project.lochighlight &&
      project.highlight &&
      project.landmark &&
      project.images.length > 0
    );
  };
</script>


 
<div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6">
          <h1 class="mb-4">Welcome to the Admin Panel</h1>
        </div>
        <div class="col-md-2 text-md-right">
          <button on:click={handleLogout} class="btn btn-danger">Logout</button>
        </div>
        <div class="col-md-4 text-md-right">
          <p id="clock">{istTime}</p>
        </div>
      </div>
    </div>
  
    <div class="row mt-4">
      <!-- Add Project Form -->
      <form class="col-md-4">
        <div class="form-group">
          <label for="title">Project Title:</label>
          <input bind:value={project.title} type="text" required class="form-control" />
        </div>
  
        <div class="form-group">
          <label for="approval" class="mt-3">Approval:</label>
          <div class="form-check">
            <input bind:checked={project.dmcaApproval} type="checkbox" class="form-check-input" id="dmcaApprovalCheckbox" />
            <label class="form-check-label" for="dmcaApprovalCheckbox">DMCA</label>
          </div>
          <div class="form-check">
            <input bind:checked={project.landApproval} type="checkbox" class="form-check-input" id="landApprovalCheckbox" />
            <label class="form-check-label" for="landApprovalCheckbox">Land Approval</label>
          </div>
        </div>
  
        <div class="form-group">
          <label for="build_up_area" class="mt-3">Build-up Area:</label>
          <input bind:value={project.buildUpArea} type="number" required class="form-control" />
        </div>
  
        <div class="form-group">
          <label for="unit_type" class="mt-3">Unit Type:</label>
          <select bind:value={project.unitType} class="form-control" required>
            <option value="">Select Unit Type</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK - 3BHK">2BHK - 3BHK</option>
            <option value="4BHK">4BHK</option>
          </select>
        </div>
  
        <div class="form-group">
          <label for="project_status" class="mt-3">Project Status:</label>
          <select bind:value={project.projectStatus} class="form-control" required>
            <option value="">Select Project Status</option>
            <option value="Completed">Completed</option>
            <option value="Project On Going">Project On Going</option>
            <option value="Project Kickoff">Project Kickoff</option>
          </select>
        </div>
  
        <div class="form-group">
          <label for="landmark" class="mt-3">Landmark:</label>
          <input bind:value={project.landmark} type="text" required class="form-control" />
        </div>

        <div class="form-group">
            <label for="landmark" class="mt-3">Project Highlight :</label>
            <input bind:value={project.highlight} type="text" required class="form-control" />
          </div>
           




          <div class="form-group">
            <label for="landmark" class="mt-3">Location Highlight:</label>
            <input bind:value={project.lochighlight} type="text" required class="form-control" />
          </div>
  
        <div class="form-group">
          <label for="images" class="mt-3">Project Images:</label>
          <input type="file" multiple accept="image/*" class="form-control" bind:files={project.images} />
        </div>
  
       
        
        
  
        <button
        on:click={isEditMode ? handleUpdateProject : handleAddProject}
        type="button"
        class="btn btn-primary mt-3"
        style="margin-bottom: 3rem;"
    >
        {#if isEditMode}
            Update Project
        {:else}
            Add Project
        {/if}
    </button>
    
    </form>
  
    <!-- Display Data Table -->
<div class="col-md-12">
    {#if storedData.length > 0}
    <table class="table">
        <thead>
            <tr>
                <th>Title</th>
                <th>Build-up Area</th>
                <th>Unit Type</th>
                <th>Project Status</th>
                <th>Landmark</th>
                <th>Location Highlight</th>
                <th>Project Highlight</th>
                <th>Images</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            {#each storedData as item, index (index)}
            <tr>
                <td>{item.title}</td>
                <td>{item.buildUpArea}</td>
                <td>{item.unitType}</td>
                <td>{item.projectStatus}</td>
                <td>{item.landmark}</td>
                <td>{item.lochighlight}</td>
                <td>{item.highlight}</td>
                <td>
                    {#each item.images as image, imageIndex (imageIndex)}
                    <img src={image} alt={`Image ${imageIndex + 1}`} style="max-width: 100px; max-height: 100px; margin-right: 5px;" />
                    {/each}
                </td>
                <td>
                    <button on:click={() => handleAction('edit', item.id)} class="btn btn-primary btn-sm edit-btn">Edit</button>
                    <button on:click={() => handleAction('delete', item.id)} class="btn btn-danger btn-sm ml-1 delete-btn">Delete</button>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
    {:else}
    <p>No data available</p>
    {/if}
</div>

    </div>
  </div>
    


  <style>
    /* Global Styles */
    @media (max-width: 767px) {
      /* Mobile Styles */
      .col-md-6 {
        width: 100%;
        padding: 0 1rem;
      }
      .col-md-2, .col-md-4, .col-md-12 {
        width: 100%;
        padding: 0 1rem;
        margin-top: 1rem;
      }
    }
  
    /* Welcome Section */
    .container-fluid {
      max-width: 1140px;
      margin: 0 auto;
    }
  
    h1 {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
  
    #clock {
      font-size: 1rem;
    }
  
    /* Form Section */
    form {
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
  
    .form-group {
      margin-bottom: 1.5rem;
    }
  
    label {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      display: block;
    }
  
    input,
    select {
      width: 100%;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
    }
  
    .btn {
      display: inline-block;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      user-select: none;
      border: 1px solid transparent;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      border-radius: 0.25rem;
      transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
  
    .btn-primary {
      color: #fff;
      background-color: #007bff;
      border-color: #007bff;
    }
  
    .btn-danger {
      color: #fff;
      background-color: #dc3545;
      border-color: #dc3545;
    }
  
    /* Data Table Section */
    table {
      width: 100%;
      margin-bottom: 1rem;
      color: #212529;
      border-collapse: collapse;
    }
  
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
  
    th {
      background-color: #f8f9fa;
    }
  
    img {
      max-width: 100px;
      max-height: 100px;
      margin-right: 5px;
    }
  
    .edit-btn, .delete-btn {
      margin-top: 0.5rem;
    }
  
    /* Responsive Styles */
    @media (max-width: 767px) {
      /* Mobile Styles */
      table {
        overflow-x: auto;
        display: block;
      }
  
      th, td {
        white-space: nowrap;
      }
  
      .edit-btn, .delete-btn {
        display: block;
        width: 100%;
      }
    }
  </style>
  