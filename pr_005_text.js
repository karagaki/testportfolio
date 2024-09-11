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
            vertical-align: ${charData.verticalOffset || '0em'};
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
        borderRadius: '550px'
    });

    const enAdjusted = adjustLetterSpacing(textInfo.en);
    const jpAdjusted = adjustLetterSpacing(textInfo.jp);
    const enAliasAdjusted = adjustLetterSpacing(textInfo.en['Alias:']);
    
    const enNicknameKey = Object.keys(textInfo.en).find(key => key !== 'text' && key !== 'font' && key !== 'chars' && key !== 'Alias:');
    const jpNicknameKey = Object.keys(textInfo.jp).find(key => key !== 'text' && key !== 'font' && key !== 'chars' && key !== '通称');
    
    const enNicknameAdjusted = enNicknameKey ? adjustLetterSpacing(textInfo.en[enNicknameKey]) : '';
    const jpAliasAdjusted = adjustLetterSpacing(textInfo.jp['通称']);
    const jpNicknameAdjusted = jpNicknameKey ? adjustLetterSpacing(textInfo.jp[jpNicknameKey]) : '';

    console.log('Adjusted text:', { enAdjusted, jpAdjusted, enAliasAdjusted, enNicknameAdjusted, jpAliasAdjusted, jpNicknameAdjusted });

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
            <h2 style="font-size: 2.5em; margin-bottom: 0.2em; font-family: ${textInfo.en.font}; ${darkTextOutline}; color: #000000;">${enAdjusted}</h2>
            <p class="alias" style="font-size: 1.2em; ${lightTextOutline}; color: #606060;">${enAliasAdjusted}</p>
            <p style="font-size: 1.6em; ${lightTextOutline}; color: #404040;">${enNicknameAdjusted}</p>
        </div>
        <div class="slide-info-bottom" style="padding: 20px; text-align: right;">
            <h2 style="font-size: 2.5em; margin-bottom: 0.2em; font-family: ${textInfo.jp.font}; ${darkTextOutline}; color: #000000;">${jpAdjusted}</h2>
            <p class="alias" style="font-size: 1.2em; ${lightTextOutline}; color: #606060;">${jpAliasAdjusted}</p>
            <p style="font-size: 1.6em; ${lightTextOutline}; color: #404040;">${jpNicknameAdjusted}</p>
        </div>
    `;

    window.container.appendChild(window.textElement);

    const enNicknameElement = window.textElement.querySelector('.slide-info-top p:last-child');
    const jpNicknameElement = window.textElement.querySelector('.slide-info-bottom p:last-child');

    if (enNicknameElement && textInfo.en['(CybercrimeInvestigationDepartment)']) {
        enNicknameElement.style.transform = 'translateX(-0.19em) scale(0.7)';
        enNicknameElement.style.transformOrigin = 'left center';
        console.log('Applied style to EN nickname:', enNicknameElement.style.transform);
    }

    if (jpNicknameElement && textInfo.jp['（サイバー犯罪捜査部）']) {
        jpNicknameElement.style.transform = 'translateX(0.85em) scale(0.9)';
        console.log('Applied style to JP nickname:', jpNicknameElement.style.transform);
    }

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
        adjustLetterSpacing,
        checkAdjustedChars
    };

})(window);