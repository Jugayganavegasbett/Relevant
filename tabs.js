(function(){
  function activate(id){
    document.querySelectorAll(".tab").forEach(b=> b.classList.toggle("active", b.dataset.target===id));
    document.querySelectorAll(".tab-content").forEach(s=> s.classList.toggle("active", s.id===id));
  }
  document.addEventListener("click",(e)=>{
    const b=e.target.closest(".tab"); if(!b) return;
    if (b.id === "adminToggle") return; // manejado en app.js
    activate(b.dataset.target);
  });
  activate("tab-generales");
})();
