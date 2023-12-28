
<svelte:head>
	<title>
		Bench Mark Builder - Login
	</title>
</svelte:head>


<script>
    import { onMount } from 'svelte';
    import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
    import Swal from 'sweetalert2';
    import { goto } from '@sapper/app';
  
    import firebaseApp from '../firebase'; // Adjust the path as needed
  
    let email = '';
    let password = '';
  
    const auth = getAuth(firebaseApp);
  
    onMount(() => {
      const inputFields = document.querySelectorAll('input[autocomplete="off"]');
      inputFields.forEach((input) => {
        input.setAttribute('autocomplete', 'new-password');
      });
  
      // Check if the user is already authenticated
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is already authenticated, redirect to the dashboard
          goto('/add-project');
        }
      });
    });
  
  

    const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Show success message with SweetAlert
    Swal.fire({
      icon: 'success',
      title: 'Login Successful',
      text: 'You are logged in!',
      showConfirmButton: false,
      timer: 2000,
    });

    // Redirect to dashboard after a delay
    setTimeout(() => {
      goto('/add-project');
    }, 2000);
  } catch (error) {
    // Show error message with SweetAlert
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: error.message,
    });
  }
};


  </script>
  

  
  <!-- Add the rest of your component as before -->
  
  <div class="rs-my-account pt-120 pb-120 md-pt-80 md-pb-80">
    <div class="container">
      <div class="row">
        <div class="col-lg-12 md-mb-50">
          <h2 class="title pb-30 md-pb-15">Login</h2>
          <div class="rs-login">
            <div class="form-group mb-30">
              <label for="">Username or email address<span>*</span></label>
              <input bind:value={email} class="form-control-mod" type="text" required />
              <label for="">Password <span>*</span></label>
              <input bind:value={password} class="form-control-mod" type="password" required />
            </div>
            <button on:click={handleLogin} class="add-btn login-btn" type="button">Log In</button>
            <div class="last-password pt-30">
              <a href="/">Lost your password?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    /* Add this CSS to your stylesheet */
  
    .form-group {
      margin-bottom: 20px;
    }
  
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      color: #333;
    }
  
    .form-control-mod {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      transition: border-color 0.3s ease-in-out;
    }
  
    .form-control-mod:focus {
      border-color: #3498db;
    }
  
    .login-btn {
      background-color: #3498db;
      color: #fff;
      padding: 12px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease-in-out;
    }
  
    .login-btn:hover {
      background-color: #2980b9;
    }
  
    .last-password a {
      color: #3498db;
      text-decoration: none;
      font-size: 14px;
    }
  
    .last-password a:hover {
      text-decoration: underline;
    }
  </style>
  