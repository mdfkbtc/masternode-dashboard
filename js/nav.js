var velesSinglePageApp = {
    'currentPage': null,
    'language': 'en',
    'defaultLanguage': 'en',
    'pageSuffix': '.html',
    'pageHooks': {},
    'cachedPages': {'en': {}},
    'eventsBound': {},
    'menuTreeIndex': {},
    'menuTemplates': {},
    'sidebarPadContent': 0,
    '$window': null,
    '$animationElements': null,
    'inViewThresholdPx': 75,
    'scrollMinStep': 50,
    'scrollLastPos': 0,
    'parallaxBottom': null,

    'go': function(page = 'index') {
        var pageHash = null;
        var pageLanguage = self.language;

        if (page.indexOf('#') != -1) {
            pageHash = '#' + page.split('#')[1];
            page = page.split('#')[0];
        }

        if (page.indexOf('.') != -1) {
             pageLanguage = page.split('.')[1];
             page = page.split('.')[0];
         }

        // check for supported languages
        if (!this.cachedPages.hasOwnProperty(pageLanguage)) {
            pageLanguage = this.defaultLanguage;
        }

        //} else if (window.location.hash)
        //    pageHash = window.location.hash;

        if (page == '')
            page = (this.currentPage) ? this.currentPage : 'index';

        // just scroll to top if its the same page
        if (this.currentPage == page || page == '') {
            if (pageHash && $(pageHash).length) {
                $('html, body').animate({ scrollTop: ($(pageHash).offset().top - 60) }, 50);
            } else {
                window.scrollTo(0,0);
            }
            return;
        }

        // cache the previous HTML, index is always cached
        this.cachedPages[this.language][this.currentPage] = $('#content-wrapper').html();

        // change the current page pointers and links
        this.currentPage = page;
        this.setActive(page);

        // change the current language according to the page address
        this.language = pageLanguage;

        // change browser's url filed
        if (history.pushState) {
            window.history.pushState(
                {'currentPage': page},
                this.getTitle(),
                "./" + page + '.' + this.language + this.pageSuffix
                );
        } else {
            document.location.href = "./" + page + '.' + this.language + this.pageSuffix;
        }

        // close the menu if open
        $('div.navbar-collapse').removeClass('show');
        $('div.navbar-collapse').addClass('hide');
        //

        // load the content if not cached, init the page scripts
        if (this.cachedPages[this.language].hasOwnProperty(page)) {
            $('#content-wrapper').html(this.cachedPages[this.language][page]);
            velesSinglePageApp.hideOverlay();
            velesSinglePageApp.hideMobileMenu();
            velesSinglePageApp.runPageHook('init');
            velesSinglePageApp.rebuildPageMenu(page, true);
            velesSinglePageApp.updateTemplate();
            velesSinglePageApp.bindEvents();
        } else {
            $('#content-wrapper').load('./templates/' + this.language + '/' + page + '.html #content', null, function() {
                velesSinglePageApp.hideOverlay();
                velesSinglePageApp.hideMobileMenu();
                velesSinglePageApp.runPageHook('init');
                velesSinglePageApp.rebuildPageMenu(page, false);
                velesSinglePageApp.updateTemplate();
                velesSinglePageApp.autoAddIds();
                velesSinglePageApp.bindEvents();
            });
        }

        // just start scrolling to the top
        if (pageHash && $(pageHash).length)
            $('html, body').animate({ scrollTop: ($(pageHash).offset().top - 60) }, 50);
        else
            window.scrollTo(0,0);
    },

    'autoAddIds': function() {
        $('h2').add('h3').each(function(i){
            if (!$(this).parents('.row').length)
                return;

            if (!$(this).parents('.row').eq(0).attr('id')) {
                $(this).parents('.row').eq(0).attr('id', $(this).text()
                    .toLowerCase().replace(': ', '').replace(' ', '-')
                    .trim());
            }
        });
        $('h4').each(function(i){
            if (!$(this).parents('div.card').length)
                return;

            if (!$(this).parents('div.card').eq(0).attr('id')) {
                $(this).parents('div.card').eq(0).attr('id', $(this).text()
                    .toLowerCase().replace(': ', '').replace(' ', '-')
                    .trim());
            }
        });
    },

    'updateTemplate': function() {
        if (this.menuTemplates.hasOwnProperty(velesSinglePageApp.currentPage)) {
            $('[data-id="page.title"]').text(velesSinglePageApp.menuTreeIndex[velesSinglePageApp.currentPage].title);
            $('[data-id="page.url"]').text(velesSinglePageApp.menuTreeIndex[velesSinglePageApp.currentPage].title);
        }
    },

    'addPageHook': function(pageName, hookName, callback) {
        if (!this.pageHooks.hasOwnProperty(pageName))
            this.pageHooks[pageName] = {}

        this.pageHooks[pageName][hookName] = callback;
    },

    'runPageHook': function(hookName, pageName = null) {
        if (!pageName)
            pageName = this.currentPage;

        if (this.pageHooks.hasOwnProperty(pageName) && this.pageHooks[pageName].hasOwnProperty(hookName))
            this.pageHooks[pageName][hookName]();
    },

    'setActive': function(page = null) {
        if (!page)
            page = this.currentPage;

        $('.nav-active').removeClass('nav-active'); // deactivate previously active tabs
        if (page == 'index')    // main index link is a special one
            $('a.navbar-brand').addClass('nav-active');

        else
            $('a[href$="' + page + this.pageSuffix + '"].nav-link').parent('li').addClass('nav-active');
    },

    'detectCurrentPageAddr': function() {
        var filename = $(window.location.pathname.split('/')).get(-1);
        var page = (filename) ? filename.replace('.html', '') : 'index.en';

        return page;
    },

    'getAddrPageName': function(page) {
        return (page.indexOf('.') != -1) ? page.split('.')[0] : page;
    },

    'getAddrPageLanguage': function(page) {
        return (page.indexOf('.') != -1) ? page.split('.')[1] : this.defaultLanguage;
    },

    'getTitle': function(page = null) {
        // todo: load titles from JSON or parse from loaded content
        return $('title').text();
    },

    'bindEvents': function() {
        // History changed event
        if (!this.eventsBound.hasOwnProperty('popstate') || !this.eventsBound['popstate']) {
            $(window).bind('popstate', function(e) {
                if (e.originalEvent.state && e.originalEvent.state.hasOwnProperty('currentPage'))
                    velesSinglePageApp.go(e.originalEvent.state.currentPage);
                else
                    velesSinglePageApp.go();
            });
            this.eventsBound['popstate'] = true;
        }

        if (!this.eventsBound.hasOwnProperty('navbar-toggler') || !this.eventsBound['navbar-toggler']) {
            $('.navbar-collapse').on('show.bs.collapse', function () {
                velesSinglePageApp.showMobileMenu();
            });
            $('.navbar-collapse').on('hide.bs.collapse', function () {
                velesSinglePageApp.hideMobileMenu();
            });
            $('#mobile-follow-toggle').click(function(){
                if (velesSinglePageApp.isMobileSliderShown())
                    velesSinglePageApp.hideMobileSlider();
                else
                    velesSinglePageApp.showMobileSlider();
            })

            $('body').resize(function(){
                if ($('.sidebar').hasClass('sidebar-expand'))
                    velesSinglePageApp.sidebarResizePage();
            });

            this.eventsBound['navbar-toggler'] = true;
        }

        // Click events on navigation links
        $('.nav-link').not('.dropdown-toggle').add('.navbar-brand').add('.dropdown-item')
            .add('.nav-vertical a').add('.breadcrumb-item a')
            .add('.sidebar a')
            .add('a.nav-page')
            .not('.nav-external-app').not('.spa').click(function(e) {
           e.preventDefault();
           velesSinglePageApp.go($(this).attr('href').replace(velesSinglePageApp.pageSuffix, ''));
        }).addClass('spa');
    },

    'hideOverlay': function(overlayName = null, fade = true, delay = 3000) {
        if (overlayName == null)
            overlayName = 'content-overlay';
        else
            overlayName += '-overlay';

        if (!this.isOverlayShown(overlayName))
            return;

        if (fade)
            $('#' + overlayName).fadeOut(delay);

        $('#content').addClass(overlayName + '-initial');
        $('#' + overlayName).addClass(overlayName + '-initial');

        window.setTimeout(function() {
            if (!fade)
                $('#' + overlayName).hide();

            $('#content').removeClass(overlayName + '-initial');
            $('#content').removeClass(overlayName);
            $('#' + overlayName).removeClass(overlayName + '-initial');
            $('body').removeClass('with-overlay');
        }, delay);
    },

    'showOverlay': function(overlayName = null, fade = true, delay = 3000) {
        if (overlayName == null)
            overlayName = 'content-overlay';
        else
            overlayName += '-overlay';

        if (this.isOverlayShown(overlayName))
            return;

        // some extra UI stuff
        this.hideMobileSlider();

        $('#' + overlayName).addClass(overlayName + '-initial');
        $('#content').addClass(overlayName + '-initial');
        $('#content').addClass(overlayName);

        if (fade)
            $('#' + overlayName).fadeIn(delay);
        else
            $('#' + overlayName).show();

        $('#' + overlayName).removeClass(overlayName + '-initial');
        $('#content').removeClass(overlayName + '-initial');
    },

    'isOverlayShown': function(overlayName) {
        return $('#' + overlayName).is(':visible');
    },

    'showMobileMenu': function() {
        this.showOverlay('mobile-menu', false, 2000);
        $('.navbar').addClass('mobile-menu');
    },

    'hideMobileMenu': function() {
        this.hideOverlay('mobile-menu', false, 100);
        $('.navbar').removeClass('mobile-menu');
    },

    'isMobileMenuShown': function() {
        return this.isOverlayShown('mobile-menu');
    },

    'showMobileSlider': function() {
        if (this.isMobileSliderShown())
            return;

        $('#mobile-follow-toggle').addClass('active');
        $('.footer-overlay').addClass('footer-panel-slide');
        $('#content').addClass('footer-panel-slide');
    },

    'hideMobileSlider': function() {
        if (!this.isMobileSliderShown())
            return;

        $('#mobile-follow-toggle').removeClass('active');
        $('.footer-overlay').removeClass('footer-panel-slide');
        $('#content').removeClass('footer-panel-slide');
    },

    'isMobileSliderShown': function() {
        return $('.footer-overlay').hasClass('footer-panel-slide');
    },

    'buildMenus': function() {
        this.menuTreeIndex = {};
        this.menuTemplates = {
            'navbar': this.extractTemplates(),
            'sidebar': this.extractTemplates('.sidebar')
        };

        this.buildMenuLevel(menuTree, $('#navbarResponsive ul.navbar-nav'), this.menuTemplates['navbar']);
        //this.buildMenuLevel(menuTree, $('.sidebar ul'), this.menuTemplates['sidebar']);

        $('.navbar .template').removeClass('template');
    },

    'rebuildPageMenu': function(page, cachedPage = false) {
        $('.sidebar ul').html('');

        if (!this.menuTreeIndex.hasOwnProperty(page)){
            console.log('[Sidebar] Page tree not indexed: ' + page);
            return;
        }

        if (this.menuTreeIndex[page].hasOwnProperty('sections')) {
            this.buildMenuLevel(
                this.menuTreeIndex[page].sections,
                $('.sidebar ul'),
                this.menuTemplates['sidebar'],
                page,
                isSectionLinks = true
            );
            this.sidebarExpand();

        } else if (this.menuTreeIndex[page].hasOwnProperty('items')) {
            this.buildMenuLevel(
                this.menuTreeIndex[page].items,
                $('.sidebar ul'),
                this.menuTemplates['sidebar'],
                page
            );
            this.sidebarExpand();
            this.sidebarResizePage();

        } else if (this.menuTreeIndex[page].parent && this.menuTreeIndex[this.menuTreeIndex[page].parent].hasOwnProperty('items')) {
            this.buildMenuLevel(
                this.menuTreeIndex[this.menuTreeIndex[page].parent].items,
                $('.sidebar ul'),
                this.menuTemplates['sidebar'],
                page.parent
            );
            // expand sidebar when parent is menu, on larger screens
            this.sidebarExpand();

            if (!cachedPage)
                this.sidebarResizePage();

        } else {
            this.sidebarExpand();
        }
    },

    'extractTemplates': function(context = null) {
        var menuTemplates = {};

        if (!context) {
            menuTemplates['subMenuItem'] = $('.dropdown-item.template')[0].outerHTML;
            $('.dropdown-item.template').remove();

            menuTemplates['menuDropdown'] = $('.nav-item.dropdown.template')[0].outerHTML;
            $('.nav-item.dropdown.template').remove();

            menuTemplates['menuItem'] = $('.nav-item.template')[0].outerHTML;
            $('.nav-item.template').remove();

        } else {
            menuTemplates['subMenuItem'] = $(context).find('.submenu-item.template')[0].outerHTML;
            $('.submenu-item.template').remove();

            menuTemplates['menuDropdown'] = $(context).find('.menu-item.submenu.template')[0].outerHTML;
            $('.menu-item.submenu.template').remove();

            menuTemplates['menuItem'] = $(context).find('.menu-item.template')[0].outerHTML;
            $('.menu-item.template').remove();
        }

        return menuTemplates;
    },

    'sidebarExpand': function() {
        if ($('body').width() > 990 ) {
            if (!$('.sidebar').hasClass('sidebar-expand')) {
                $('.sidebar').addClass('sidebar-expand');
            }
        }
    },

    'sidebarCollapse': function() {
        $('.sidebar').removeClass('sidebar-expand');
    },

    'sidebarResizePage': function() {
        if ($('body').width() > 990) {
            $('#content').css('padding-left', 0);
            this.sidebarLeftPadContent = (($('body').width() * 0.2) - 20 - (($('body').width()-$('#content').width()) / 2));

            if ((($('body').width()-$('#content').width()) / 2) < ($('body').width() * 0.2)) {
                $('#content').css('padding-left', this.sidebarLeftPadContent+'px');
            } else {
                $('#content-wrapper').css('padding-left', 'unset');
            }
            $('#footer-content').css('padding-left', 0);
            this.sidebarLeftPadContent = (($('body').width() * 0.2) - 20 - (($('body').width()-$('#content').width()) / 2));

            if ((($('body').width()-$('#footer-content').width()) / 2) < ($('body').width() * 0.2)) {
                $('#footer-content').css('padding-left', this.sidebarLeftPadContent+'px');
            } else {
                $('#footer-wrapper').css('padding-left', 'unset');
            }

        }
    },

    'buildMenuLevel': function(tree, $parent, templates, parentPage = null, isSectionLinks = false) {
        var prevPage = null;
        var url = null;

        for (var i = 0; i < tree.length; i++) {
            if (!tree[i].hasOwnProperty('hideFromNav') && !tree[i].hideFromNav) {
                if (!tree[i].hasOwnProperty('page'))
                    tree[i].page = tree[i].title.toLowerCase().replace(' ', '-');

                url = (isSectionLinks)
                    ? '#' +  tree[i].page
                    : tree[i].page + '.' + this.language + this.pageSuffix;

                var hackH = false;

                if(typeof tree[i].url !== "undefined") {
                    url = tree[i].url;
                    hackH = true;
                }
                if (tree[i].hasOwnProperty('items')) {
                    var $item = $(templates['menuDropdown']
                        .replace('{{item.title}}', tree[i].title)
                        .replace('{{item.url}}', url)
                        .replace('{{item.page}}', tree[i].page).replace('{{item.page}}', tree[i].page)
                        .replace('class="', (hackH ? 'class="nav-external-app ' : 'class="'))
                        );

                    $subMenu = $lastItem = $item.appendTo($parent).find('div');
                    this.buildMenuLevel(tree[i].items, $subMenu, templates, tree[i].page);

                } else {
                    var item = ((parentPage) ? templates['subMenuItem'] : templates['menuItem'])
                        .replace('{{item.title}}', tree[i].title)
                        .replace('{{item.url}}', url)
                        .replace('class="', (hackH ? 'class="nav-external-app ' : 'class="'));

                    $lastItem = $parent.append(item);
                }
                if(typeof tree[i].url !== "undefined")
                    $lastItem.addClass('external-rul');
            }

            // Index to the smarter structure
            if (!this.menuTreeIndex.hasOwnProperty(tree[i].page)) {
                this.menuTreeIndex[tree[i].page] = tree[i];
                this.menuTreeIndex[tree[i].page].next = null;
                this.menuTreeIndex[tree[i].page].prev = null;
                this.menuTreeIndex[tree[i].page].parent = parentPage;

                if (prevPage) {
                    this.menuTreeIndex[prevPage].next = tree[i].page;
                    this.menuTreeIndex[tree[i].page].prev = prevPage;
                }
                prevPage = tree[i].page;
            }
        }
    },

    'start': function() {
        var pageAddr = this.detectCurrentPageAddr();
        this.language = this.getAddrPageLanguage(pageAddr);
        this.currentPage = 'index';

/*
        // Maintenance mode
        if (window.location.host == 'veles.network' || window.location.host == 'www.veles.network') {
            $('.stage').addClass('stage-enlarge');
            $('.face2').add('.face5').text('Website under maintenance');
            $('.face3').add('.face6').text('New content coming soon');
            $('.face4').add('.face1').text('Stay tuned');
            return;
        }
*/

        this.buildMenus();

        // only the index is pre-loaded
        if (this.getAddrPageName(pageAddr) == 'index') {
            this.setActive();
            this.rebuildPageMenu('index', false);
            this.updateTemplate();
            this.autoAddIds();
            this.runPageHook('init');
            this.hideOverlay();
            this.bindEvents();

            if (window.location.hash)
                $('html, body').animate({ scrollTop: ($(window.location.hash).offset().top - 60) },50);
        } else {
            this.go(pageAddr + window.location.hash);
        }
    }
}

/* Mark current page's tab as active (if found in main nav) */
$(document).ready(function() {
    velesSinglePageApp.start();
});
