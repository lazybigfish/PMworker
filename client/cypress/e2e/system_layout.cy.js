describe('System Module Layout Consistency', () => {
  const viewports = [
    { width: 1920, height: 1080, name: '1080p' },
    { width: 1366, height: 768, name: 'Notebook' },
    { width: 1440, height: 900, name: 'Macbook' }
  ];

  const modules = [
    { name: 'UserManager', path: '/system/users', title: '用户管理' },
    { name: 'PermissionManager', path: '/system/permissions', title: '角色管理' },
    { name: 'ConfigManager', path: '/system/configs', title: '配置管理' }
  ];

  beforeEach(() => {
    // Mock Login
    cy.visit('/');
    // Assuming we have a login mechanism or mock token
    // cy.login('admin', '123456');
  });

  viewports.forEach(viewport => {
    context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      modules.forEach(module => {
        it(`should have consistent layout in ${module.name}`, () => {
          cy.viewport(viewport.width, viewport.height);
          cy.visit(module.path);

          // 1. Check Container Width
          cy.get('.sys-module-container').should('exist')
            .and('have.css', 'max-width', '1440px')
            .and('have.css', 'min-width', '1200px');

          // 2. Check Padding
          cy.get('.sys-module-container')
            .should('have.css', 'padding-left', '24px')
            .should('have.css', 'padding-right', '24px')
            .should('have.css', 'padding-top', '16px');

          // 3. Check Header Height
          cy.get('.sys-module-header')
            .should('have.css', 'height', '56px');

          // 4. Check Title
          cy.get('.sys-module-title')
            .should('contain', module.title)
            .and('have.css', 'font-size', '16px');

          // 5. Check Table Existence (except maybe permission manager which uses Grid/Tree)
          if (module.name !== 'PermissionManager') {
             cy.get('.sys-table').should('exist');
          }
          
          // Visual Regression (Placeholder)
          // cy.matchImageSnapshot(`${module.name}-${viewport.name}`);
        });
      });
    });
  });
});
