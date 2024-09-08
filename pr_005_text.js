 // pr_005_text.js

(function(window) {
    if (window.Project5Text) {
        console.warn('Project5Text has already been initialized. Skipping re-initialization.');
        return;
    }
    
    window.Project5TextInitialized = true;


    window.textData = [
    {
        name1: 'Trojan Horse', 
        alias1: '',                
        nickname1: '',
        name2: 'トロイの木馬', 
        alias2: '',                  
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Stealth Virus', 
        alias1: 'Alias:',         
        nickname1: 'Ghost Virus', 
        name2: 'ステルス型ウイルス', 
        alias2: '通称',          
        nickname2: 'ゴースト・ウイルス',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Stealth Virus', 
        alias1: 'Alias:',         
        nickname1: 'Dark Virus', 
        name2: 'ステルス型ウイルス', 
        alias2: '通称',          
        nickname2: 'ダーク・ウイルス',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Mutation Virus', 
        alias1: 'Alias:',        
        nickname1: 'Alien Virus', 
        name2: 'ミューテーション型ウイルス', 
        alias2: '通称',   
        nickname2: 'エイリアン・ウイルス',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Browser Hijacking', 
        alias1: 'Alias:',     
        nickname1: 'Porn Wear', 
        name2: 'ブラウザハイジャック', 
        alias2: '通称',        
        nickname2: 'ポルノ・ウェア',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'RansomWare', 
        alias1: 'Alias:',            
        nickname1: 'Mafia Wear', 
        name2: 'ランサムウエア', 
        alias2: '通称',             
        nickname2: 'マフィア・ウェア',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Logic Bomb', 
        alias1: 'Alias:', 
        nickname1: 'SmileMark Bomb', 
        name2: 'ロジックボム', 
        alias2: '通称', 
        nickname2: 'スマイルマーク・ボム',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'SpyWare', 
        alias1: '', 
        nickname1: '', 
        name2: 'スパイウェア', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Cracking', 
        alias1: '', 
        nickname1: '', 
        name2: 'クラッキング', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Cyberterrorism', 
        alias1: '', 
        nickname1: '', 
        name2: 'サイバーテロ', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Attacking', 
        alias1: '', 
        nickname1: '', 
        name2: 'アタッキング', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Bots (spambots)', 
        alias1: '', 
        nickname1: '', 
        name2: 'ボット（スパムボット）', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Mass Mailing Type Worm', 
        alias1: 'Alias:', 
        nickname1: 'Love Letter Worm', 
        name2: 'マスメーリング型ワーム', 
        alias2: '通称', 
        nickname2: 'ラブレター・ワーム',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Networked Worms', 
        alias1: 'Alias:', 
        nickname1: 'Hydra Worm', 
        name2: 'ネットワーク型ワーム', 
        alias2: '通称', 
        nickname2: 'ヒュドラ・ワーム',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Keylogger', 
        alias1: '', 
        nickname1: '', 
        name2: 'キーロガー', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Scareware', 
        alias1: 'Alias:', 
        nickname1: 'Error Vaccine', 
        name2: 'スケアウェア', 
        alias2: '通称', 
        nickname2: 'エラー・ワクチン',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Christmas Card virus', 
        alias1: 'Alias:', 
        nickname1: 'Christmas Card virus', 
        name2: 'パスワードスティーラ', 
        alias2: '通称', 
        nickname2: 'クリスマスカード・ウイルス',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: '〈Spear Phishing〉 Phishing', 
        alias1: '', 
        nickname1: '', 
        name2: '〈スピアフィッシング〉フィッシング', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Backdoors', 
        alias1: '', 
        nickname1: '', 
        name2: 'バックドア', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Hacking', 
        alias1: '', 
        nickname1: '', 
        name2: 'ハッキング', 
        alias2: '', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    },
    {
        name1: 'Net Police ', 
        alias1: '(Cybercrime Investigation Department)', 
        nickname1: '', 
        name2: 'ネットポリス', 
        alias2: '（サイバー犯罪捜査部）', 
        nickname2: '',
        fontEn: "'Kosugi Maru', sans-serif",
        fontJp: "'Kiwi Maru', serif"
    }
];




function displayTextInfo(index) {
    console.log('Displaying text info for index:', index);
    const textInfo = getTextInfo(index);

    if (!window.textElement) {
        window.textElement = document.createElement('div');
        window.textElement.className = 'slide-info';
        Object.assign(window.textElement.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: '10',
            pointerEvents: 'none',
            color: '#ffffff',
            fontFamily: "'Arial', sans-serif",
            fontSize: '16px',
            lineHeight: '1.5',
            opacity: 0,
            borderRadius: '550px'
        });
        window.container.appendChild(window.textElement);
    }


    window.textElement.innerHTML = '';
    window.textElement.appendChild(topContent);
    window.textElement.appendChild(bottomContent);

    gsap.to(window.textElement, {
        duration: 0.5,
        opacity: 1,
        ease: "power2.out",
        onComplete: () => {
            console.log('Text animation completed');
            checkAdjustedChars();
        }
    });
}


    function getTextInfo(index) {
        if (index >= 0 && index < window.textData.length) {
            return window.textData[index];
        } else {
            return {
                name1: "Error: Invalid Index",
                name2: "Error: Invalid Index",
                alias1: "",
                nickname1: "",
                alias2: "",
                nickname2: ""
            };
        }
    }

    function adjustLetterSpacing(text) {
        console.log('Adjusting letter spacing for:', text);

        const adjustments = {
            'バックドア': [
                { chars: 'バ', spacing: '-0.12em' },
                { chars: 'ッ', spacing: '0.1em' },
                { chars: 'ク', spacing: '-0.1em' },
                { chars: 'ド', spacing: '0.1em' },
                { chars: 'ア', spacing: '0.1em' }
            ],
            'スパイウェア': [
                { chars: 'スパ', spacing: '-0.05em' },
                { chars: 'イ', spacing: '-0.1em' },
                { chars: 'ウェ', spacing: '-0.15em' },
                { chars: 'ア', spacing: '-0.05em' }
            ],
        };
        
        const generalAdjustments = [
            { chars: 'ア|の|木|バ', spacing: '-0.05em' },
            { chars: 'ク|シ|ュ|ィ|ト|ド|ロ|サ|ウ', spacing: '-0.2em' },
            { chars: 'ミ|テ|ム|タ|イ|ョ|フ|ワ|ェ|ラ', spacing: '-0.25em' },
            { chars: '〈|〉|ジ|ッ|ャ', spacing: '-0.3em' },
            { chars: '・', spacing: '-0.35em' }
        ];

        // Apply word-specific adjustments
        for (const [word, wordAdjustments] of Object.entries(adjustments)) {
            if (text.includes(word)) {
                console.log('Applying word-specific adjustment for:', word);
                let adjustedWord = '';
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    const adjustment = wordAdjustments.find(adj => adj.chars.includes(char));
                    if (adjustment) {
                        adjustedWord += `<span style="letter-spacing: ${adjustment.spacing}; display: inline-block;" class="adjusted-char">${char}</span>`;
                    } else {
                        adjustedWord += char;
                    }
                }
                text = text.replace(word, adjustedWord);
            }
        }

        // Apply general adjustments
        generalAdjustments.forEach(({ chars, spacing }) => {
            const regex = new RegExp(`(${chars})`, 'g');
            text = text.replace(regex, `<span style="letter-spacing: ${spacing}; display: inline-block;" class="adjusted-char">$1</span>`);
        });

        console.log('Adjusted text:', text);
        return text;
    }



function displayTextInfo(index) {
    console.log('Displaying text info for index:', index);
    const textInfo = getTextInfo(index);

    if (window.textElement) {
        window.textElement.remove();
    }

    const outlineStyle = `
        text-shadow: 
            -1px -1px 0 #FFF,
            1px -1px 0 #FFF,
            -1px 1px 0 #FFF,
            1px 1px 0 #FFF;
    `;

    window.textElement = document.createElement('div');
    window.textElement.className = 'slide-info';
    Object.assign(window.textElement.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: '10',
        pointerEvents: 'none',
        color: '#ffffff',
        background: 'radial-gradient(circle, rgba(255,255,255,0) 20%, rgba(70, 29, 73, 0.5) 80%)',
        fontFamily: "'Arial', sans-serif",
        lineHeight: '1.0',
        opacity: 0,
        borderRadius: '550px'  // マスクに合わせて角丸を追加
    });



    window.textElement.innerHTML = `
        <div class="slide-info-top" style="padding: 20px;">
            <h2 style="font-size: 2.5em; margin-bottom: 0.2em; ${outlineStyle}">${textInfo.name1}</h2>
            
            <p class="alias" style="font-size: 1.2em; margin-bottom: 0.1em;  ${outlineStyle}">${textInfo.alias1}</p>
            
            <p style="font-size: 1.6em; ${outlineStyle}">${textInfo.nickname1}</p>
        </div>
        <div class="slide-info-bottom" style="padding: 20px; text-align: right;">
            
            <h2 style="font-size: 2.5em; margin-bottom: 0.2em; ${outlineStyle}">${adjustLetterSpacing(textInfo.name2)}</h2>
            
            <p class="alias" style="font-size: 1.2em; margin-bottom: 0.1em; ${outlineStyle}">${adjustLetterSpacing(textInfo.alias2)}</p>
            
            <p style="font-size: 1.6em; ${outlineStyle}">${adjustLetterSpacing(textInfo.nickname2)}</p>
        </div>
    `;

    window.container.appendChild(window.textElement);

    // テキスト要素をフェードインさせる
    gsap.to(window.textElement, {
        duration: 0.9,
        opacity: 1,
        ease: "power2.out",
        onComplete: () => {
            console.log('Text animation completed');
            checkAdjustedChars();
        }
    });
}


    function checkAdjustedChars() {
        const adjustedChars = document.querySelectorAll('.adjusted-char');
        console.log('Number of adjusted characters:', adjustedChars.length);
        adjustedChars.forEach((char, index) => {
            console.log(`Char ${index}:`, char.textContent, 'Style:', char.getAttribute('style'));
        });
    }

    window.Project5Text = {
        displayTextInfo,
        getTextInfo,
        adjustLetterSpacing
    };

})(window);