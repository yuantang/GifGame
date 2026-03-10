/**
 * Now冥想10周年庆 - 1:1 还原设计稿逻辑
 *
 * ====== 转盘物理布局说明 ======
 * wheel.png 从12点钟方向起，顺时针角度对应的扇区：
 *   0°  → 一等奖
 *  60°  → 谢谢参与
 * 120°  → 二等奖
 * 180°  → 谢谢参与
 * 240°  → 三等奖
 * 300°  → 四等奖
 *
 * 旋转公式：要让物理角度 A 的扇区到达12点（指针处），
 * 转盘需顺时针旋转 (360 - A)° 的对应量。
 * 即：finalAngle % 360 = (360 - targetAngle) % 360
 */

(function () {
    'use strict';

    // ===== 奖品配置：顺序必须与 wheel.png 物理扇区位置完全一致！ =====
    const PRIZES = [
        { name: '一等奖',   desc: '0元学价值¥25800正念引导师培课',    probability: 0,      isWin: true  },
        { name: '谢谢参与', desc: '很遗憾，未中奖，感谢参与',           probability: 0.2725, isWin: false },
        { name: '二等奖',   desc: '0元学正念/冥想正汇合一期课程',       probability: 0.015,  isWin: true  },
        { name: '谢谢参与', desc: '感谢参与，期待下次再相遇',           probability: 0.2725, isWin: false },
        { name: '三等奖',   desc: '《多舛的生命》或《正念的奇迹》一本', probability: 0.19,   isWin: true  },
        { name: '四等奖',   desc: 'Now年卡会员一张',                   probability: 0.25,   isWin: true  }
    ];

    const wheelImg   = document.getElementById('wheelImg');
    const drawBtn    = document.getElementById('drawBtn');
    const modal      = document.getElementById('resultModal');
    const modalClose = document.getElementById('modalClose');
    const modalBtn   = document.getElementById('modalBtn');
    const modalIcon  = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrize = document.getElementById('modalPrize');

    let isSpinning = false;
    let totalRotation = 0; // 累计旋转角度（只增不减）

    // ===== 生成简单的设备指纹 (Device Fingerprint) =====
    function getDeviceFingerprint() {
        const info = [
            navigator.userAgent,
            screen.width + 'x' + screen.height,
            navigator.language,
            navigator.platform
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < info.length; i++) {
            const char = info.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'dfp_' + Math.abs(hash);
    }

    // ===== 初始化：检查参与状态 =====
    function checkDrawStatus() {
        const fingerprint = getDeviceFingerprint();
        const hasDrawnByFP = localStorage.getItem('drawn_' + fingerprint);
        const hasDrawnLegacy = localStorage.getItem('now_10th_has_drawn');
        
        return !!(hasDrawnByFP || hasDrawnLegacy);
    }

    // ===== 抽奖概率逻辑 =====
    function pickPrize() {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < PRIZES.length; i++) {
            cumulative += PRIZES[i].probability;
            if (rand < cumulative) return i;
        }
        return 1;
    }

    // ===== 抽奖执行逻辑 =====
    function spin(targetIndex) {
        if (isSpinning) return;
        
        if (checkDrawStatus()) {
            showNoticeModal('您已参与过', '您已参与过活动，每人仅限一次机会哦！');
            return;
        }

        isSpinning = true;
        drawBtn.disabled = true;

        // 目标奖项在 wheel.png 中的物理角度
        const targetPhysicalAngle = targetIndex * 60;

        // 计算需要旋转的步长，消除累积角度误差
        const targetRest = (360 - targetPhysicalAngle) % 360;
        const currentRest = totalRotation % 360;

        let addDeg = targetRest - currentRest;
        if (addDeg <= 0) addDeg += 360;

        // 加上随机 7-8 圈并增加一点扇区内偏移（+/- 20度）
        const randomOffset = (Math.random() - 0.5) * 40;
        const extraRounds = 7 + Math.floor(Math.random() * 2);
        const totalAddDeg = (extraRounds * 360) + addDeg + randomOffset;

        totalRotation += totalAddDeg;

        console.log(
            `[抽奖] 奖项: ${PRIZES[targetIndex].name} | 指纹: ${getDeviceFingerprint()} | 总旋转: ${totalRotation}°`
        );

        wheelImg.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(() => {
            isSpinning = false;
            drawBtn.disabled = false;
            
            // 写入持久化标记
            const fp = getDeviceFingerprint();
            localStorage.setItem('drawn_' + fp, 'true');
            localStorage.setItem('now_10th_has_drawn', 'true');
            
            showResult(targetIndex);
        }, 5200);
    }

    // ===== 弹窗展示 =====
    function showResult(index) {
        const prize = PRIZES[index];
        modalIcon.textContent = prize.isWin ? '🎉' : '😊';
        modalTitle.textContent = prize.isWin ? '恭喜中奖！' : '下次再来';
        modalPrize.textContent = prize.desc;
        modal.classList.add('active');
    }

    function showNoticeModal(title, text) {
        modalIcon.textContent = '💡';
        modalTitle.textContent = title;
        modalPrize.textContent = text;
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // ===== 事件绑定 =====
    drawBtn.addEventListener('click', () => {
        if (checkDrawStatus()) {
            showNoticeModal('您已参与过', '您已参与过活动，每人仅限一次机会哦！');
            return;
        }
        spin(pickPrize());
    });

    modalClose.addEventListener('click', closeModal);
    modalBtn.addEventListener('click', closeModal);

    (function init() {
        if (checkDrawStatus()) {
            console.log('检测到此设备已参与活动');
        }
    })();
})();
