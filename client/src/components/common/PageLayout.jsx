import React from 'react';
import '../../styles/system-layout.css';

/**
 * 全局通用页面布局组件
 * @param {string} title - 页面标题
 * @param {ReactNode} actions - 右上角操作按钮组
 * @param {ReactNode} children - 内容区域
 * @param {ReactNode} pagination - 分页组件 (可选，会自动放置在底部)
 * @param {boolean} noCard - 是否不使用默认卡片包裹 (默认 false)
 */
export default function PageLayout({ title, actions, children, pagination, noCard = false }) {
  return (
    <div className="sys-module-container">
      {noCard ? (
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
         </div>
      ) : (
        <div className="sys-module-card">
          <div className="sys-module-header">
            <div className="sys-module-title">{title}</div>
            <div className="sys-module-actions">
              {actions}
            </div>
          </div>
          <div className="sys-module-content">
            <div className="sys-module-table-wrapper">
              {children}
            </div>
            {pagination && (
              <div className="sys-module-pagination">
                {pagination}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
