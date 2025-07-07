document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.href = 'portal.html';
    } else {
      alert(data.message || 'Login failed');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Something went wrong');
  });
});
