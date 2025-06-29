document.addEventListener('DOMContentLoaded', function () {
  const platformButtons = document.querySelectorAll('.platform-btn');

  // 读取已保存的平台并设置选中样式
  chrome.storage.sync.get({ selectedPlatform: 'gmgn' }, function (result) {
    if (result.selectedPlatform) {
      const selectedBtn = document.getElementById(`${result.selectedPlatform}-btn`);
      if (selectedBtn) {
        selectedBtn.classList.add('selected');
      }
    }
  });

  // 给每个按钮添加点击事件
  platformButtons.forEach(button => {
    button.addEventListener('click', function () {
      // 移除所有按钮的选中样式
      platformButtons.forEach(btn => btn.classList.remove('selected'));
      // 给当前按钮添加选中样式
      this.classList.add('selected');
      // 保存平台 key（如 'axiom'）
      const platformKey = this.id.replace('-btn', '');
      chrome.storage.sync.set({ selectedPlatform: platformKey });
    });
  });
});