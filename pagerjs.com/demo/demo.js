requirejs.config({
    shim:{
        bootstrap:['jquery'],
        hashchange:['jquery']
    },
    paths:{
        jquery:'jquery-1.7.2.min',
        underscore:'lodash.min',
        knockout:'knockout-2.1.0',
        pager:'pager.min',
        bootstrap:'bootstrap/js/bootstrap.min',
        hashchange:'jquery.ba-hashchange.min',
        "zoidberg":'character/zoidberg'
    }
});

requirejs(['jquery', 'knockout', 'underscore', 'pager', 'bootstrap', 'hashchange'], function ($, ko, _, pager) {


    pager.PageAccordionItem = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        pager.Page.apply(this, arguments);
    };
    pager.PageAccordionItem.prototype = new pager.Page();

    // get second child
    pager.PageAccordionItem.prototype.getAccordionBody = function () {
        return $(this.element).children()[1];
    };

    // hide second child
    pager.PageAccordionItem.prototype.hideElement = function (callback) {
        // use hide if it is the first time the page is hidden
        if (!this.pageAccordionItemHidden) {
            this.pageAccordionItemHidden = true;
            $(this.getAccordionBody()).hide();
            if (callback) {
                callback();
            }
        } else { // else use a slideUp animation
            $(this.getAccordionBody()).slideUp();
            if (callback) {
                callback();
            }
        }
    };

    // show the second child using a slideDown animation
    pager.PageAccordionItem.prototype.showElement = function (callback) {
        $(this.getAccordionBody()).slideDown();
        if (callback) {
            callback();
        }
    };

    ko.bindingHandlers['page-accordion-item'] = {
        init:function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var pageAccordionItem = new pager.PageAccordionItem(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            pageAccordionItem.init();
        },
        update:function () {
        }
    };

    ko.bindingHandlers['prettyprint'] = {
        init:function(element) {
            var $element = $(element);
            $element.html(prettyPrintOne($element.html(), undefined, true));
        }
    };

    ko.bindingHandlers['tooltip'] = {
        init:function(element) {
            $(element).tooltip();
        }
    };

    var viewModel = {
        question: ko.observable('How many roads must a man walk down before you can call him a man?'),
        closePage: function(page) {
            return function() {
                page.hideElementWrapper();
                return true;
            };
        },
        theID: ko.observable(''),
        theSecondID: ko.observable(''),
        name:ko.observable("Pelle"),
        description:ko.observable('pl'),
        externalContentLoaded:function (page) {
        },
        externalContentLazyLoaded: function(page) {
        },
        afterFryIsDisplayed:function () {
            $('body').css("background-color", "#FF9999");
        },
        beforeFryIsHidden:function () {
            $('body').stop().css("background-color", "#FFFFFF");
        },
        showFry:function (page, callback) {
            $(page.element).fadeIn(1000, callback);
        },
        hideFry:function (page, callback) {
            $(page.element).fadeOut(1000, function () {
                $(page.element).hide();
                if (callback) {
                    callback();
                }
            });
        },
        textLoader:function (page, element) {
            var loader = {};
            var txt = $('<h3></h3>', {text:'Loading ' + page.getValue().title});
            loader.load = function () {
                $(element).prepend(txt);
            };
            loader.unload = function () {
                txt.remove();
            };
            return loader;
        },
        randomFailed:function (page, route) {
            viewModel.newChildren.push({
                childId:route[0]
            });
            page.showPage(route);
        },
        loggedIn:ko.observable(false),
        isLoggedIn:function (page, route, callback) {
            if (viewModel.loggedIn()) {
                callback();
            } else {
                window.location.href = "#!/guards/login";
            }
        },
        logout:function () {
            viewModel.loggedIn(false);
            return true;
        },
        newChildren:ko.observableArray([])
    };

    window.delaySource = function(url) {
        var iframe = $('<iframe width="300" height="380" frameborder="0" allowtransparency="true"></iframe>');
        return function(page, callback) {
            setTimeout(function() {
                $(page.element).append(iframe);
                iframe.attr('src', url);
                callback();
            }, 2000);
        };
    };

    window.requireVM = function (module) {
        return function (callback) {
            require([module], function (mod) {
                callback(mod.getVM());
            });
        };
    };

    window.requireView = function (viewModule) {
        return function (page, callback) {
            require([viewModule], function (viewString) {
                $(page.element).html(viewString);
                callback();
            });
        };
    };

    window.recapLoaded = function (page) {
        $('.tt').tooltip();

        // for each h3
        var h3s = $('h3', $(page.element));
        $.each(h3s, function (h3Index, h3) {
            var $h3 = $(h3);
            // get all siblings until another h3 or h2
            var siblings = $([]);
            var sibling = $h3.next();
            while (sibling && sibling.length > 0 && sibling[0].tagName.toLocaleLowerCase() !== 'h3' && sibling[0].tagName.toLocaleLowerCase() !== 'h2') {
                siblings.push(sibling);
                sibling = sibling.next();
            }
            // hide all siblings
            siblings.toggle();
            // on h3-click toggle all siblings
            $h3.click(function () {
                siblings.toggle();
            });
        });
    };

    pager.onBindingError.add(function(event) {
        var page = event.page;
        $(page.element).empty().append('<div class="alert"> Error Loading Page</div>');
    });


    var indexOfCurrentPage = function(page) {
        return page.parentPage.children.indexOf(page);
    };

    window.nextPage = function(page) {
        return ko.computed(function() {
            return page.parentPage.children()[(Math.abs(indexOfCurrentPage(page))) + 1] || page.nullObject;
        });
    };

    window.previousPage = function(page) {
        return ko.computed(function() {
            return page.parentPage.children()[(Math.abs(indexOfCurrentPage(page))) - 1] || page.nullObject;
        });
    };

    var pageStep = function(page, step) {
        return ko.computed(function() {
            var rawStep = ko.utils.unwrapObservable(step);
            return page.parentPage.children()[(Math.abs(indexOfCurrentPage(page))) + rawStep] || page.nullObject;
        });
    };


    var NextPage = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        pager.Href.apply(this, arguments);
        this.val = pageStep(this.getParentPage(), valueAccessor());
    };

    NextPage.prototype = new pager.Href();

    NextPage.prototype.init = function () {
        this.path = ko.computed(function () {
            var value = this.val();
           return value.getFullRoute()().join('/');
        }, this);
    };

    NextPage.prototype.bind = function () {
        pager.Href.prototype.bind.apply(this);

        ko.computed(function () {
            var page = this.val();
            var pageId = page.getId();
            var text = $(this.element).text();
            if (text.length === 0) {
                text = page.val('title');
                if (pageId) {
                    ko.applyBindingsToNode(this.element, {
                        text:text
                    });
                }
            } else if (text.indexOf('{0}')) {
                text = text.replace('{0}', page.val('title'));
                if (pageId) {
                    ko.applyBindingsToNode(this.element, {
                        text:text
                    });
                }
            }
        }, this);
    };

    ko.bindingHandlers['page-step'] = {
        init:function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var href = new NextPage(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            href.init();
            href.bind();
            element.__ko__page = href;
        },
        update:function () {
        }
    };



    $(function () {

        pager.Href.hash = '#!/';

        pager.extendWithPage(viewModel);
        window.VM = viewModel;
        ko.applyBindings(viewModel);
        pager.startHashChange();

        $('.dropdown-toggle').dropdown();
    });


});