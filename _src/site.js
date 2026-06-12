(function(){
  var sidebar=document.getElementById('sidebar');
  var toggle=document.getElementById('navToggle');
  var overlay=document.getElementById('overlay');
  var toTop=document.getElementById('toTop');

  function closeNav(){sidebar.classList.remove('open');}
  toggle.addEventListener('click',function(){sidebar.classList.toggle('open');});
  overlay.addEventListener('click',closeNav);

  // keep the active nav item in view
  var active=sidebar.querySelector('.toc a.active');
  if(active){active.scrollIntoView({block:'center'});}

  // back to top
  window.addEventListener('scroll',function(){
    if(window.scrollY>600)toTop.classList.add('show');else toTop.classList.remove('show');
  });
  toTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});

  // image lightbox
  var lb=document.getElementById('lightbox');
  var lbImg=lb.querySelector('img');
  function openLb(src){lbImg.src=src;lb.classList.add('open');document.body.style.overflow='hidden';}
  function closeLb(){lb.classList.remove('open');document.body.style.overflow='';lbImg.src='';}
  [].slice.call(document.querySelectorAll('.reader figure img')).forEach(function(img){
    img.addEventListener('click',function(){openLb(img.currentSrc||img.src);});
  });
  lb.addEventListener('click',closeLb);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.classList.contains('open'))closeLb();});
})();
