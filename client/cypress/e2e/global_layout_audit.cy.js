describe('System-wide Layout Consistency Audit', () => {
  const viewports = [
    { width: 1920, height: 1080, name: '1080p' },
    { width: 1366, height: 768, name: 'Notebook' },
    { width: 1440, height: 900, name: 'Macbook' }
  ];

  const pages = [
    { name: 'Dashboard', path: '/', title: '项目概览' },
    { name: 'ProjectList', path: '/projects', title: '项目管理' },
    { name: 'TaskManager', path: '/tasks', title: '任务管理' },
    { name: 'DocumentCenter', path: '/documents', title: '文档中心' },
    { name: 'ForumHome', path: '/forum', title: '水漫金山 (论坛)' },
    { name: 'CalendarView', path: '/calendar', title: '日历排程' },
    { name: 'SupplierManager', path: '/suppliers', title: '供应商管理' },
    { name: 'ReportCenter', path: '/reports', title: '报表与分析' },
    { name: 'UserManager', path: '/system/users', title: '用户管理' },
    { name: 'PermissionManager', path: '/system/permissions', title: '角色管理' },
    { name: 'ConfigManager', path: '/system/configs', title: '配置管理' }
  ];

  beforeEach(() => {
    // Mock login or set token if needed
    // cy.login(); 
    cy.visit('/');
  });

  viewports.forEach(viewport => {
    context(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      pages.forEach(page => {
        it(`should have consistent layout on ${page.name}`, () => {
          cy.viewport(viewport.width, viewport.height);
          cy.visit(page.path);

          // 1. Check Page Container
          cy.get('.sys-module-container').should('exist')
            .and('have.css', 'max-width', '1440px')
            .and('have.css', 'min-width', '1200px')
            .and('have.css', 'padding-left', '24px')
            .and('have.css', 'padding-right', '24px')
            .and('have.css', 'padding-top', '16px');

          // 2. Check Card Structure (if not "noCard" page)
          // Some pages like Dashboard/Report might be noCard, but they use .sys-module-card inside
          // We check if at least one .sys-module-card exists
          cy.get('.sys-module-card').should('exist');

          // 3. Check Title Consistency (if using standard header)
          // Note: Dashboard/Forum use noCard layout, so title is rendered differently inside PageLayout
          // PageLayout renders title in .sys-module-title ONLY if not noCard.
          // If noCard, the title is not rendered by PageLayout's header.
          // Wait, PageLayout implementation:
          // if (noCard) { ... children } else { ... header with title ... }
          // So for noCard pages, we might not see .sys-module-title unless added manually?
          // Let's check PageLayout implementation again.
          // Correct, if noCard is true, the wrapper with .sys-module-title is skipped.
          // But standard pages (Project, Task, User, etc.) should have it.
          
          if (!['Dashboard', 'ForumHome', 'CalendarView', 'ReportCenter'].includes(page.name)) {
             cy.get('.sys-module-title').should('exist')
               .and('contain', page.title)
               .and('have.css', 'font-size', '16px');
             
             cy.get('.sys-module-header').should('have.css', 'height', '56px');
          }

          // 4. Check Table Consistency (if applicable)
          if (['ProjectList', 'TaskManager', 'DocumentCenter', 'SupplierManager', 'UserManager', 'ConfigManager'].includes(page.name)) {
             cy.get('.sys-table').should('exist');
             // Check table header background (from CSS var or AntD default override)
             cy.get('.sys-table .ant-table-thead > tr > th')
               .should('have.css', 'background-color', 'rgb(250, 250, 250)'); // #fafafa
          }

          // 5. Visual Snapshot (Optional)
          // cy.matchImageSnapshot(`${page.name}-${viewport.name}`);
        });
      });
    });
  });
});
