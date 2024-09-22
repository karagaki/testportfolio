// pr_005_text.js

(function(window) {
    if (window.Project5Text) {
        console.warn('Project5Text has already been initialized. Skipping re-initialization.');
        return;
    }
    
    window.Project5TextInitialized = true;

    const generalAdjustments = [
        { chars: '壱|弐', spacing: '0.0em' },
        { chars: '参|四', spacing: '0.0em' },
        { chars: '伍|六', spacing: '0.0em' }
    ];

    function adjustLetterSpacing(textData) {
        if (!textData || (!textData.chars && !textData.text)) {
            return '';
        }

        if (textData.text && !textData.chars) {
            return textData.text;
        }

        let adjustedText = '';
        const groupStyle = textData.groupStyle || {};
        const groupStyleString = Object.entries(groupStyle).map(([key, value]) => `${key}:${value}`).join(';');

        adjustedText += `<span style="${groupStyleString}">`;

        for (const charData of textData.chars) {

let style = `
    display: inline-block;
    letter-spacing: ${charData.spacing || '0em'};
    vertical-align: ${charData.Shift || '0em'}; 
    font-size: ${charData.fontSize || '1em'};
`;

            const generalAdjustment = generalAdjustments.find(adj => new RegExp(adj.chars).test(charData.char));
            if (generalAdjustment) {
                style += `letter-spacing: ${generalAdjustment.spacing};`;
            }

            adjustedText += `<span style="${style}" class="adjusted-char">${charData.char}</span>`;
        }

        adjustedText += '</span>';
        return adjustedText;
    }

    function displayTextInfo(indexOrImageFile) {
        console.log('displayTextInfo called with:', indexOrImageFile);

        let index;
        if (typeof indexOrImageFile === 'string') {
            index = window.imageToIndexMap[indexOrImageFile];
        } else {
            index = indexOrImageFile;
        }

        const textInfo = window.textData[index];
        if (!textInfo) {
            console.error('Text info not found for:', indexOrImageFile);
            return;
        }

        console.log('Text info:', textInfo);

        if (window.textElement) {
            window.textElement.remove();
        }

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
    borderRadius: '550px',
    userSelect: 'none', // 追加
});

        const darkTextOutline = `
            text-shadow: 
                -1px -1px 0 #E0E0E0,
                1px -1px 0 #E0E0E0,
                -1px 1px 0 #E0E0E0,
                1px 1px 0 #E0E0E0;
        `;

        const lightTextOutline = `
            text-shadow: 
                0.5px 0.5px 0 #E0E0E0,
                -0.5px 0.5px 0 #E0E0E0,
                0.5px -0.5px 0 #E0E0E0,
                -0.5px -0.5px 0 #E0E0E0;
        `;

        window.textElement.innerHTML = `
            <div class="slide-info-top" style="padding: 20px;">
                <h2 style="font-size: 2.5em; margin-bottom: 0.2em; font-family: ${textInfo.en.font}; ${darkTextOutline}; color: #000000;"></h2>
                <p class="alias" style="font-size: 1.2em; ${lightTextOutline}; color: #e0e0e0;"></p>
                <p style="font-size: 1.6em; ${lightTextOutline}; color: #e0e0e0;"></p>
            </div>
            <div class="slide-info-bottom" style="padding: 20px; text-align: right;">
                <h2 style="font-size: 2.5em; margin-bottom: 0.2em; font-family: ${textInfo.jp.font}; ${darkTextOutline}; color: #000000;"></h2>
                <p class="alias" style="font-size: 1.2em; ${lightTextOutline}; color: #e0e0e0;"></p>
                <p style="font-size: 1.6em; ${lightTextOutline}; color: #e0e0e0;"></p>
            </div>
        `;
        
        style.textContent += `
    .slide-info * {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
`;

        window.container.appendChild(window.textElement);

        const enNicknameElement = window.textElement.querySelector('.slide-info-top p:last-child');
        const jpNicknameElement = window.textElement.querySelector('.slide-info-bottom p:last-child');

        if (enNicknameElement && textInfo.en['(CybercrimeInvestigationDepartment)']) {
            enNicknameElement.style.transform = 'translateX(-0.19em) scale(0.77)';
            enNicknameElement.style.transformOrigin = 'left center';
        }

        if (jpNicknameElement && textInfo.jp['（サイバー犯罪捜査部）']) {
            jpNicknameElement.style.transform = 'translateX(0.94em) scale(0.9)';
        }

        gsap.to(window.textElement, {
            duration: 0.9,
            opacity: 1,
            ease: "power2.out",
            onComplete: () => {
                console.log('Text animation completed');
                startTextAnimation(textInfo);
            }
        });
    }

    function startTextAnimation(textInfo) {
        const elements = [
            { el: '.slide-info-top h2', text: textInfo.en },
            { el: '.slide-info-top p.alias', text: textInfo.en['Alias:'] },
            { el: '.slide-info-top p:last-child', text: textInfo.en[Object.keys(textInfo.en).find(key => key !== 'text' && key !== 'font' && key !== 'chars' && key !== 'Alias:')] },
            { el: '.slide-info-bottom h2', text: textInfo.jp },
            { el: '.slide-info-bottom p.alias', text: textInfo.jp['通称'] },
            { el: '.slide-info-bottom p:last-child', text: textInfo.jp[Object.keys(textInfo.jp).find(key => key !== 'text' && key !== 'font' && key !== 'chars' && key !== '通称')] }
        ];

        elements.forEach((item, index) => {
            const element = window.textElement.querySelector(item.el);
            if (element && item.text) {
                setTimeout(() => {
                    typeText(element, item.text);
                }, index * 300); // 1秒ごとに次の行のアニメーションを開始
            }
        });
    }

    function typeText(element, textData) {
        element.innerHTML = ''; 
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.textContent = '|';
        cursor.style.animation = 'blink 0.7s infinite';
        element.appendChild(cursor);

        let charIndex = 0;
        const chars = textData.chars || [{ char: textData.text }];

        function typeNextChar() {
            if (charIndex < chars.length) {
                const charData = chars[charIndex];
                const charSpan = document.createElement('span');
                charSpan.textContent = charData.char;
                charSpan.style.display = 'inline-block';
                charSpan.style.letterSpacing = charData.spacing || '0em';
                charSpan.style.verticalAlign = charData.Shift || '0em'; 
                charSpan.style.fontSize = charData.fontSize || '1em';

                element.insertBefore(charSpan, cursor);
                charIndex++;
                setTimeout(typeNextChar, 50); 
            } else {
                cursor.remove(); 
            }
        }

        typeNextChar();
    }

    function checkAdjustedChars() {
        const adjustedChars = document.querySelectorAll('.adjusted-char');
        console.log('Number of adjusted characters:', adjustedChars.length);
        adjustedChars.forEach((char, index) => {
            console.log(`Char ${index}:`, char.textContent, 'Style:', char.getAttribute('style'));
        });
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
        }
        .typing-cursor {
            display: inline-block;
            width: 2px;
            height: 1em;
            background-color: currentColor;
            margin-left: 2px;
            animation: blink 0.7s infinite;
        }
    `;
    document.head.appendChild(style);

    window.Project5Text = {
        displayTextInfo,
        adjustLetterSpacing,
        checkAdjustedChars
    };

})(window);