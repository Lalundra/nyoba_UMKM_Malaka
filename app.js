const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s),root=$('#app');
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const IMG='https://placehold.co/600x450/D4A373/292524?text=UMKM';
const fail=()=>{root.innerHTML='<p class="msg">Gagal memuat data. Silakan coba lagi.</p>'};
function toast(m,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3000)}
const cart={get(){try{return JSON.parse(localStorage.getItem('cart')||'[]')}catch{return[]}},
 set(c){localStorage.setItem('cart',JSON.stringify(c));cartBadge()},
 add(id,q=1){const c=this.get(),i=c.find(x=>x.id===id);i?i.quantity+=q:c.push({id,quantity:q});this.set(c);toast('Ditambahkan ke keranjang')}};
function cartBadge(){const e=$('#cbadge');if(e)e.textContent=cart.get().reduce((a,b)=>a+b.quantity,0)||''}
async function getProfile(){const{data:{session}}=await sb.auth.getSession();if(!session)return null;const{data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();return data}
async function nav(){
 const el=$('#nav');if(!el)return;const p=await getProfile();
 el.innerHTML=`<header class="nav"><a class="logo" href="./index.html">RUMAH UMKM</a><button id="burger" aria-label="Menu">☰</button><nav id="menu"><a href="./index.html">Home</a><a href="./products.html">Produk</a><a href="./products.html#kategori">Kategori</a><a href="./index.html#tentang">Tentang Kami</a><a href="./index.html#kontak">Kontak</a></nav><div class="right"><form id="sf"><input id="sq" placeholder="Cari produk..."></form><a href="./cart.html">🛒<b id="cbadge"></b></a>${p?`<a href="./orders.html">${esc(p.full_name||'Akun')}</a>${p.role==='admin'?'<a href="./admin/admin.html">Admin</a>':''}<a href="#" id="lo">Logout</a>`:'<a href="./login.html">Login</a>'}</div></header>`;
 $('#burger').onclick=()=>$('#menu').classList.toggle('open');
 $('#sf').onsubmit=e=>{e.preventDefault();location='./products.html?q='+encodeURIComponent($('#sq').value)};
 const lo=$('#lo');if(lo)lo.onclick=async e=>{e.preventDefault();await sb.auth.signOut();location='./index.html'};cartBadge()}
const card=p=>`<article class="card"><img src="${esc(p.image_url||IMG)}" alt="${esc(p.name)}" loading="lazy"><div class="cb"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><p>${esc((p.description||'').slice(0,60))}</p><b>${rp(p.price)}</b><small>Stok: ${p.stock}</small><div class="btns"><a class="btn o" href="./product-detail.html?id=${p.id}">Lihat Detail</a><button class="btn" ${p.stock<1?'disabled':''} data-add="${p.id}">Tambah ke Keranjang</button></div></div></article>`;
async function grid(el,q){el.innerHTML='<p class="msg">Memuat...</p>';const{data,error}=await q;if(error){el.innerHTML='<p class="msg">Gagal memuat data. Silakan coba lagi.</p>';return}el.innerHTML=data.length?data.map(card).join(''):'<p class="msg">Belum ada produk.</p>'}
document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a)cart.add(a.dataset.add)});
const active=()=>sb.from('products').select('*').eq('is_active',true);
const pages={
home(){root.innerHTML=`<section class="hero"><div><h1>Produk Lokal, Pilihan Terbaik untuk Anda</h1><p>Temukan berbagai produk UMKM pilihan dengan kualitas terbaik dari pelaku usaha lokal.</p><a class="btn" href="./products.html">Belanja Sekarang</a></div><img src="https://placehold.co/600x450/D4A373/292524?text=Produk+UMKM" alt="Produk UMKM"></section><section class="wrap"><h2>Produk Terbaru</h2><div class="grid" id="g"></div></section><section class="wrap" id="tentang"><h2>Tentang Kami</h2><p>Rumah UMKM adalah toko online yang menghubungkan pelaku usaha lokal Indonesia dengan pembeli.</p></section><section class="wrap" id="kontak"><h2>Kontak</h2><p>WhatsApp: 0812-0000-0000 · Email: halo@rumahumkm.id</p></section>`;
 grid($('#g'),active().order('created_at',{ascending:false}).limit(8))},
products(){const u=new URLSearchParams(location.search),q=u.get('q')||'',c=u.get('cat')||'';
 root.innerHTML=`<section class="wrap" id="kategori"><h1>Produk</h1><div class="chips" id="ch"></div><div class="grid" id="g"></div></section>`;
 sb.from('categories').select('name').order('name').then(({data})=>{$('#ch').innerHTML=`<a class="chip ${c?'':'on'}" href="./products.html">Semua</a>`+(data||[]).map(x=>`<a class="chip ${c===x.name?'on':''}" href="?cat=${encodeURIComponent(x.name)}">${esc(x.name)}</a>`).join('')});
 let s=active().order('name');if(q)s=s.ilike('name','%'+q.replace(/[%,]/g,'')+'%');if(c)s=s.eq('category',c);grid($('#g'),s)},
async detail(){const id=new URLSearchParams(location.search).get('id');
 const{data:p,error}=await active().eq('id',id).maybeSingle();
 if(error||!p){root.innerHTML='<p class="msg">Produk tidak ditemukan atau gagal dimuat. Silakan coba lagi.</p>';return}
 root.innerHTML=`<section class="wrap det"><img src="${esc(p.image_url||IMG)}" alt="${esc(p.name)}"><div><small>${esc(p.category)}</small><h1>${esc(p.name)}</h1><h2>${rp(p.price)}</h2><p>Stok: ${p.stock}</p><p>${esc(p.description)}</p><input type="number" id="qty" value="1" min="1" max="${p.stock}"><div class="btns"><button class="btn o" id="add" ${p.stock<1?'disabled':''}>Add to Cart</button><button class="btn" id="buy" ${p.stock<1?'disabled':''}>Buy Now</button></div></div></section>`;
 const q=()=>Math.max(1,Math.min(p.stock,+$('#qty').value||1));
 $('#add').onclick=()=>cart.add(p.id,q());$('#buy').onclick=()=>{cart.add(p.id,q());location='./cart.html'}},
async cart(){
 let c=cart.get();if(!c.length){root.innerHTML='<p class="msg">Keranjang kosong. <a href="./products.html">Belanja sekarang</a></p>';return}
 const{data,error}=await active().in('id',c.map(x=>x.id));if(error)return fail();
 const m=Object.fromEntries(data.map(p=>[p.id,p]));c=c.filter(x=>m[x.id]);cart.set(c);
 const draw=()=>{if(!c.length){pages.cart();return}
  root.innerHTML=`<section class="wrap"><h1>Keranjang</h1>${c.map(i=>`<div class="row item"><img class="th" src="${esc(m[i.id].image_url||IMG)}"><div style="flex:1"><b>${esc(m[i.id].name)}</b><br>${rp(m[i.id].price)}</div><button class="btn o" data-a="-" data-i="${i.id}">−</button><span>${i.quantity}</span><button class="btn o" data-a="+" data-i="${i.id}">+</button><button class="btn o" data-a="x" data-i="${i.id}">Hapus</button></div>`).join('')}<h2>Total: ${rp(c.reduce((s,i)=>s+m[i.id].price*i.quantity,0))}</h2>
  <h2>Checkout</h2><form id="co" class="form"><input name="nama" required placeholder="Nama"><input name="wa" required placeholder="Nomor WhatsApp"><textarea name="alamat" required placeholder="Alamat"></textarea><input name="kota" required placeholder="Kota"><input name="pos" required placeholder="Kode Pos"><textarea name="catatan" placeholder="Catatan"></textarea><select name="pay"><option>Transfer Bank</option><option>E-Wallet</option><option>COD</option></select><button class="btn">Buat Pesanan</button></form></section>`;
  root.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const i=c.find(x=>x.id===b.dataset.i),a=b.dataset.a;
   if(a==='+')i.quantity=Math.min(m[i.id].stock,i.quantity+1);else if(a==='-')i.quantity=Math.max(1,i.quantity-1);else c=c.filter(x=>x!==i);cart.set(c);draw()});
  $('#co').onsubmit=async e=>{e.preventDefault();const{data:{session}}=await sb.auth.getSession();if(!session){toast('Silakan login terlebih dahulu.',1);setTimeout(()=>location='./login.html?next=cart',900);return}
   const f=new FormData(e.target),addr=`${f.get('nama')} | WA: ${f.get('wa')}\n${f.get('alamat')}, ${f.get('kota')} ${f.get('pos')}\nCatatan: ${f.get('catatan')||'-'}`;
   const{error}=await sb.rpc('place_order',{items:c.map(i=>({id:i.id,quantity:i.quantity})),payment:f.get('pay'),address:addr});
   if(error){toast(/Stok/.test(error.message)?'Stok tidak cukup.':'Gagal membuat pesanan.',1);return}
   cart.set([]);toast('Pesanan berhasil dibuat.');setTimeout(()=>location='./orders.html',1000)}};draw()},
login(){const next=new URLSearchParams(location.search).get('next');
 root.innerHTML=`<section class="wrap auth"><h1>Masuk</h1><form id="lf" class="form"><input name="email" type="email" required placeholder="Email"><input name="password" type="password" required placeholder="Password"><button class="btn">Login</button></form><h1>Daftar</h1><form id="rf" class="form"><input name="name" required placeholder="Nama lengkap"><input name="phone" placeholder="No. telepon"><input name="email" type="email" required placeholder="Email"><input name="password" type="password" minlength="6" required placeholder="Password (min. 6)"><button class="btn">Daftar</button></form></section>`;
 $('#lf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const{error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
  if(error)return toast('Email atau password salah.',1);location=next==='cart'?'./cart.html':'./index.html'};
 $('#rf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const{data,error}=await sb.auth.signUp({email:f.get('email'),password:f.get('password'),options:{data:{full_name:f.get('name'),phone:f.get('phone')}}});
  if(error)return toast('Gagal mendaftar. Coba email lain.',1);
  if(data.session)location='./index.html';else toast('Akun dibuat. Cek email untuk konfirmasi, lalu login.')}},
async orders(){const p=await getProfile();if(!p){location='./login.html';return}
 const{data,error}=await sb.from('orders').select('*,order_items(quantity,products(name))').eq('user_id',p.id).order('created_at',{ascending:false});if(error)return fail();
 root.innerHTML=`<section class="wrap"><h1>Riwayat Pesanan</h1><p>${esc(p.full_name)} · ${esc(p.email)}</p>${data.length?`<div class="tw"><table><tr><th>Order ID<th>Tanggal<th>Produk<th>Total<th>Status</tr>${data.map(o=>`<tr><td>${o.id.slice(0,8)}<td>${new Date(o.created_at).toLocaleDateString('id-ID')}<td>${o.order_items.map(i=>esc(i.products?.name)+' ×'+i.quantity).join('<br>')}<td>${rp(o.total_price)}<td><span class="badge">${o.status}</span></tr>`).join('')}</table></div>`:'<p class="msg">Belum ada pesanan.</p>'}</section>`}};
nav();try{const r=pages[document.body.dataset.page]?.();if(r&&r.catch)r.catch(fail)}catch(e){fail()}
