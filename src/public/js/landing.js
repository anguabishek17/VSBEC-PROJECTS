const startBtn = document.getElementById('startBtn');
const flower = document.getElementById('flower');

startBtn?.addEventListener('click', () => {
  flower.classList.add('animate');
  setTimeout(() => {
    window.location.href = '/auth/login';
  }, 2000);
});
