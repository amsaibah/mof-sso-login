document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    //validation
    if (!email.endsWith('@mofth.omnicrosoft.com')) {
        alert('Please use your @mofth.omnicrosoft.com email address');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    //API call to authenticate
    console.log('Login attempt with:', email);
    alert('Login functionality will be implemented with backend integration');
    
});

// Forgot password link
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Password reset functionality will be implemented');
});