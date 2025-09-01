  (function(){
    const PAIRS_COUNT = 8; // 8 צמדים = 16 קלפים
    const ANIMALS = [
      "🐶","🐱","🦊","🐻","🐼","🐨","🐯","🦁","🐷","🐸","🐵","🐔","🐧","🐦","🦉","🐴",
      "🦄","🐝","🐛","🦋","🐞","🐢","🐍","🐙","🦑","🐳","🐬","🐟","🐊","🦒","🦓","🦘",
      "🦥","🦔","🦙","🦜"
    ];

    const boardEl = document.getElementById('board');
    const p0 = {
      panel: document.getElementById('player-0-panel'),
      nameEl: document.getElementById('p0-name'),
      turnEl: document.getElementById('p0-turn'),
      scoreEl: document.getElementById('p0-score'),
      streakEl: document.getElementById('p0-streak'),
      matchesEl: document.getElementById('p0-matches')
    };
    const p1 = {
      panel: document.getElementById('player-1-panel'),
      nameEl: document.getElementById('p1-name'),
      turnEl: document.getElementById('p1-turn'),
      scoreEl: document.getElementById('p1-score'),
      streakEl: document.getElementById('p1-streak'),
      matchesEl: document.getElementById('p1-matches')
    };
    const turnNameEl = document.getElementById('turn-name');

    const startOverlay = document.getElementById('startOverlay');
    const btnStart = document.getElementById('btnStart');
    const nameOverlay = document.getElementById('nameOverlay');
    const nameModal = document.getElementById('nameModal');
    const nameTitle = document.getElementById('nameTitle');
    const nameInput = document.getElementById('nameInput');
    const nameOk = document.getElementById('nameOk');
    const winnerOverlay = document.getElementById('winnerOverlay');
    const winnerName = document.getElementById('winnerName');
    const btnRestart = document.getElementById('btnRestart');
    const btnCloseWinner = document.getElementById('btnCloseWinner');

    let state = {};

    function shuffle(arr){
      for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      return arr;
    }

    function createDeck(){
      const pool = shuffle(ANIMALS.slice()).slice(0, PAIRS_COUNT);
      const pairs = pool.flatMap((emoji, idx)=>[
        {id:`${idx}-a`, emoji, matched:false},
        {id:`${idx}-b`, emoji, matched:false},
      ]);
      return shuffle(pairs);
    }

    function resetState(){
      state = {
        deck: createDeck(),
        flipped: [],
        lock:false,
        players:[
          {name: p0.nameEl.textContent || 'שחקן 1', score:0, streak:0, emojis:[]},
          {name: p1.nameEl.textContent || 'שחקן 2', score:0, streak:0, emojis:[]}
        ],
        current:0,
        totalPairs: PAIRS_COUNT,
      };
      p0.matchesEl.innerHTML='';
      p1.matchesEl.innerHTML='';
      p0.scoreEl.textContent = '0';
      p1.scoreEl.textContent = '0';
      p0.streakEl.textContent = 'רצף: 0';
      p1.streakEl.textContent = 'רצף: 0';
      p0.panel.classList.remove('on-fire');
      p1.panel.classList.remove('on-fire');
      updateTurnPill();
      updateLeaderGlow();
      renderBoard();
      dealAnimation();
    }

    function renderBoard(){
      boardEl.innerHTML = '';
      state.deck.forEach((card, i)=>{
        const cardEl = document.createElement('button');
        cardEl.className = 'card deal-in';
        cardEl.setAttribute('data-i', i);
        cardEl.style.setProperty('--i', i);
        cardEl.setAttribute('aria-label','קלף');
        cardEl.innerHTML = `
          <div class="card-inner">
            <div class="card-face card-back"></div>
            <div class="card-face card-front"><div class="emoji">${card.emoji}</div></div>
          </div>`;
        cardEl.addEventListener('click',()=>onCardClick(cardEl, card));
        boardEl.appendChild(cardEl);
      });
    }

    function onCardClick(cardEl, card){
      if(state.lock) return;
      if(cardEl.classList.contains('matched') || cardEl.classList.contains('flip')) return;

      cardEl.classList.add('flip');
      state.flipped.push({el: cardEl, data: card});

      if(state.flipped.length===2){
        state.lock = true;
        const [a,b] = state.flipped;
        const isMatch = a.data.emoji === b.data.emoji;
        if(isMatch){
          setTimeout(()=>{
            a.el.classList.add('matched');
            b.el.classList.add('matched');
            a.data.matched = b.data.matched = true;
            handleMatch(a.data.emoji);
            state.flipped = [];
            state.lock = false;
            checkEnd();
          }, 420);
        } else {
          setTimeout(()=>{
            a.el.classList.remove('flip');
            b.el.classList.remove('flip');
            state.flipped = [];
            handleMiss();
            state.lock = false;
          }, 650);
        }
      }
    }

    function handleMatch(emoji){
      const cur = state.players[state.current];
      cur.score += 1;
      cur.streak += 1;
      cur.emojis.push(emoji);
      updateScoresUI();
      pushEmojiToList(state.current, emoji);

      if(cur.streak >= 3){
        (state.current===0? p0.panel : p1.panel).classList.add('on-fire');
      }

      updateLeaderGlow();
    }

    function handleMiss(){
      const cur = state.players[state.current];
      cur.streak = 0;
      (state.current===0? p0.panel : p1.panel).classList.remove('on-fire');
      updateScoresUI();
      state.current = state.current===0?1:0;
      updateTurnPill();
    }

    function updateScoresUI(){
      p0.scoreEl.textContent = state.players[0].score;
      p1.scoreEl.textContent = state.players[1].score;
      p0.streakEl.textContent = `רצף: ${state.players[0].streak}`;
      p1.streakEl.textContent = `רצף: ${state.players[1].streak}`;
    }

    function pushEmojiToList(playerIdx, emoji){
      const list = playerIdx===0? p0.matchesEl : p1.matchesEl;
      const item = document.createElement('div');
      item.className = 'emoji';
      item.textContent = emoji;
      list.prepend(item);
    }

    function updateTurnPill(){
      p0.turnEl.classList.toggle('active', state.current===0);
      p1.turnEl.classList.toggle('active', state.current===1);
      turnNameEl.textContent = state.players[state.current].name;
    }

    function updateLeaderGlow(){
      const s0 = state.players[0].score;
      const s1 = state.players[1].score;
      p0.panel.classList.toggle('leader', s0>s1);
      p1.panel.classList.toggle('leader', s1>s0);
    }

    function checkEnd(){
      const total = state.players[0].score + state.players[1].score;
      if(total >= state.totalPairs){
        const s0 = state.players[0].score;
        const s1 = state.players[1].score;
        let text = '';
        if(s0 === s1){
          text = `תיקו! (${state.players[0].name} ${s0} — ${s1} ${state.players[1].name})`;
        } else {
          const winner = s0>s1? state.players[0].name : state.players[1].name;
          text = `המנצח/ת: ${winner}`;
        }
        winnerName.textContent = text;
        winnerOverlay.classList.add('show');
      }
    }

    let nameStep = 0;
    let savedNames = ['שחקן 1','שחקן 2'];

    function openNameModal(step){
      nameStep = step;
      nameOverlay.classList.add('show');
      if(step===0){
        nameTitle.textContent = 'שם שחקן 1';
        nameInput.value = savedNames[0];
        nameInput.placeholder = 'שחקן 1';
        nameModal.animate([
          {transform:'translateY(-16px) scale(.95)', opacity:.0},
          {transform:'translateY(0) scale(1)', opacity:1}
        ], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
      } else {
        nameTitle.textContent = 'שם שחקן 2';
        nameInput.value = savedNames[1];
        nameInput.placeholder = 'שחקן 2';
        nameModal.animate([
          {transform:'translateY(16px) scale(.95)', opacity:.0},
          {transform:'translateY(0) scale(1)', opacity:1}
        ], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
      }
      nameInput.focus({preventScroll:true});
      nameInput.select();
    }

    function confirmName(){
      const val = (nameInput.value || '').trim() || (nameStep===0? 'שחקן 1':'שחקן 2');
      savedNames[nameStep] = val;
      const targetEl = nameStep===0 ? p0.nameEl : p1.nameEl;
      flyName(val, targetEl);
      if(nameStep===0){
        setTimeout(()=>openNameModal(1), 450);
      } else {
        setTimeout(()=>{
          nameOverlay.classList.remove('show');
          p0.nameEl.textContent = savedNames[0];
          p1.nameEl.textContent = savedNames[1];
          resetState();
        }, 480);
      }
    }

    function flyName(text, target){
      const ghost = document.createElement('div');
      ghost.textContent = text;
      ghost.style.position='fixed';
      ghost.style.left='50%'; ghost.style.top='50%';
      ghost.style.transform='translate(-50%,-50%)';
      ghost.style.padding='6px 12px';
      ghost.style.borderRadius='12px';
      ghost.style.background='linear-gradient(180deg,#ffe18b,#f7c948)';
      ghost.style.color='#111';
      ghost.style.fontWeight='900';
      ghost.style.zIndex='60';
      ghost.style.boxShadow='0 10px 30px rgba(247,201,72,.45)';
      document.body.appendChild(ghost);

      const rect = target.getBoundingClientRect();
      const keyframes = [
        {transform:'translate(-50%,-50%) scale(1)', opacity:1},
        {transform:`translate(${rect.left + rect.width/2}px, ${rect.top + rect.height/2}px) scale(.7)`, opacity:.0}
      ];
      ghost.animate(keyframes, {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'}).addEventListener('finish', ()=>{
        document.body.removeChild(ghost);
        target.textContent = text;
      });
    }

    btnStart.addEventListener('click', ()=>{
      startOverlay.classList.remove('show');
      setTimeout(()=>openNameModal(0), 150);
    });

    nameOk.addEventListener('click', confirmName);
    nameInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') confirmName(); });

    btnRestart.addEventListener('click', ()=>{
      winnerOverlay.classList.remove('show');
      setTimeout(()=>openNameModal(0), 150);
    });
    btnCloseWinner.addEventListener('click', ()=>{ winnerOverlay.classList.remove('show'); });


  })();
