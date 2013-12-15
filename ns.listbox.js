(function ($) {

    $.listBox = {
        defaults: {
            url             : "",
            type            : 'checkbox',
            defaultItems    : null,
            controlBar      : {
                visible        : true,
                position       : 'bottom',
                searchVisible  : true,
                sortAscVisible : true,
                sortDescVisible: true,
                statusText     : true
            },
            cols            : 1,
            onDataLoaded    : null,
            prepareData     : null,
            creationComplete: null
        }
    };


    $.fn.listBox = function (opt) {

        var _self = this;

        if (typeof opt == 'string') {
            var args = Array.prototype.slice.call(arguments);
            args.splice(0, 1);
            _self = $(this).data('listbox');
            return _self[opt].apply(this, args);
        }

        var _opt = $.extend(true, {}, $.listBox.defaults, opt);


        this.selectItems = function (values) {
            var that = this;
            $.each(values, function (i, item) {
                $('.col[value="' + item + '"]', that).each(function () {
                    var me = $(this);
                    me.addClass('selected');
                    _trigger.call(that, 'onSelect', {
                        'context': that,
                        'element': this,
                        'item'   : {
                            'label': me.find('span').text(),
                            'value': me.attr('value')
                        }
                    });
                });
            });
        }


        this.selectAll = function () {
            if (_opt.type == 'radio') {
                return;
            }

            var me, i = 0, that = this;
            $(this).find(".col").each(function () {
                me = $(this);
                me.addClass("selected");

                _trigger.call(this, 'onSelect', {
                    context: that,
                    element: this,
                    item   : {
                        label: me.text(),
                        value: me.attr('value')
                    }
                });
                i++;
            });
            _e.call(this, '#sa').attr('checked', 'checked');
            _changeStatus.call(this, i);
        };


        this.deselectAll = function () {
            if (_opt.type == 'radio') {
                return;
            }
            var me, that = this;
            $(this).find(".col").each(function () {
                me = $(this);
                me.removeClass("selected");
                _trigger.call(that, 'onDeselect', {
                    'context': that,
                    'item'   : {
                        'label': me.text(),
                        'value': me.attr('value')
                    }
                });
            });
            _changeStatus.call(this, 0);
        };


        this.getSelectedItems = function () {
            var res = [];
            $(this).find(".col.selected").each(function () {
                res.push($(this).attr("value"));
            });
            if (_opt.type == 'radio' && res.length > 0) {
                res = res[0];
            }
            return res;
        };


        this.toSerialize = function () {
            var res = _self['getSelectedItems'].call(this), id = $(this).attr('data-id');
            if (res.length == 0) {
                return '';
            }
            return id + ((_opt.type == 'radio') ? '=' + res[0] : '[]=' + res.join('&' + id + '[]='));
        }


        this.load = function (url) {

            url = (url) ? url : _opt.url;
            if (_isEmpty(url)) {
                return;
            }

            var me = this;
            $('.container', this).html('<div class="loading">Loading...</div>');

            $.ajax({
                url     : url,
                cache   : false,
                global  : false,
                type    : "GET",
                dataType: "json",
                success : function (data) {
                    _trigger('onDataLoaded', {
                        data: data
                    });
                    var d = (_opt.prepareData == null) ? data : _opt.prepareData(data);
                    _self.loadData.call(me, d);
                }
            });
        };


        this.loadData = function (data) {

            if (data == null)
                return;

            _generateDataTable.call(this, data);

            if (_opt.creationComplete)
                _opt.creationComplete(_self, data);


        }


        this.searchData = function (searchString) {
            _e.call(this, '.filter').removeClass('filter');
            if ($.trim(searchString) != '') {
                var res = _e.call(this, '.table').find('.col:icontains(' + searchString + ')');
                if (res.length > 0) {
                    res.addClass('filter');
                }
            }
        }


        this.sortData = function (type) {
            var dataArray = [];

            $(this).find('.table .row .col').each(function () {
                var me = $(this);
                dataArray.push({
                    label   : me.text(),
                    value   : me.attr('value'),
                    selected: me.hasClass('selected')
                })
            });
            if (type.toLowerCase() == 'asc') {
                dataArray = dataArray.sort(function (a, b) {
                    return (a.label > b.label) ? 1 : (a.label < b.label) ? -1 : 0;
                });
            } else if (type.toLowerCase() == 'desc') {
                dataArray = dataArray.sort(function (a, b) {
                    return (a.label < b.label) ? 1 : (a.label > b.label) ? -1 : 0;
                });
            }

            _generateDataTable.call(this, dataArray);
        }


        this.addItems = function (item) {
            var row = $('.table .row:last-child', this),
                cpos = row.children().length,
                table = $('.table', this),
                me = this;

            $.each(item, function (i, data) {
                if (cpos == 3) {
                    row = $('<div>').addClass('row');
                    table.append(row);
                    cpos = 0;
                }
                row.append(_createItem.call(me, data));
                cpos++;
            });
            /*
             var row = $('.table .row:last-child', this),
             clen = row.children().length,
             col = _createItem.call(this, item);

             if(clen == _opt.cols) {
             row =  $('<div>').addClass('row');
             $('.table', this).append(row);
             }
             row.append( col );
             */
        }


        function _generateDataTable(data) {
            if (_opt.defaultItems && _opt.defaultItems.length > 0) {
                data = [].concat(_opt.defaultItems).concat(data);
            }

            var me = this, tbl = $('<div>').addClass('table'),
                col = 1, row = $('<div>').addClass('row'),
                dataLen = data.length, selItem = 0;

            $.each(data, function (i, item) {
                row.append(_createItem.call(me, item));
                col++;
                if (!_isEmpty(item.selected)) {
                    selItem++;
                }
                if (col > _opt.cols || i >= dataLen - 1) {
                    tbl.append(row);
                    col = 1;
                    row = $('<div>').addClass('row');
                }
            });

            $('.container', this).html("").append(tbl);
            var ch = 0;
            if (_opt.controlBar.visible == true) {
                ch = parseInt($('.controlBar', this).outerHeight(true));
            }
            $('.container', this).css('height', ( parseInt($(this).outerHeight(true)) - ch ) + 'px');

            _e.call(this, '#totalItem').text(dataLen);
            _changeStatus.call(this, selItem);

        }

        function _createItem(item) {
            var me = this, col = $('<div>').addClass('col');

            // Need to make single event.
            col.attr('value', item.value).append('<span>' + item.label + '</span>').click(function () {
                _itemClickHandler.call(me, col, item.label, item.value);
            });

            if (!_isEmpty(item.selected)) {
                col.addClass('selected');
                _trigger.call(me, 'onSelect', {
                    'context': col,
                    'item'   : {
                        'label': item.label,
                        'value': item.value
                    }
                });
            }
            return col;
        }


        function _getId(id) {
            return $(this).attr('id') + '_' + id;
        }


        function _createControlBar(container) {

            var me = this;

            var inp = $('<input id="' + _getId.call(me, 'sa') + '" type="checkbox" class="selectAll"/>').click(function (event) {
                if (typeof $(this).attr('checked') == 'undefined') {
                    _self['deselectAll'].call(me);
                } else {
                    _self['selectAll'].call(me);
                }

            });

            var ctrlbar = $('<div class="controlBar ' + _opt.controlBar.position + '">')
            if (_opt.type == 'checkbox') {
                ctrlbar
                    .append($('<div class="selectAll">')
                        .append(inp))
                /* .append('<label for="' + _getId.call(this, 'sa') + '" class="selectAll"></label>')*/
            }


            if (_opt.controlBar.searchVisible == true) {
                ctrlbar
                    .append('<input type="text" id="' + _getId.call(this, 'searchInput') + '" class="searchInput"/>')
                    .append('<div id="' + _getId.call(this, 'search') + '" class="search"></div>')
            }

            if (_opt.controlBar.sortAscVisible == true) {
                ctrlbar.append('<div id="' + _getId.call(this, 'sortAsc') + '" class="sort asc"></div>')
            }

            if (_opt.controlBar.sortDescVisible == true) {
                ctrlbar.append('<div id="' + _getId.call(this, 'sortDesc') + '" class="sort desc"></div>');
            }


            if (_opt.controlBar.statusText == true) {
                var t1 = '';

                if (_opt.type == 'checkbox') {
                    var t1 = '<span>,&nbsp;Selected :<span id="' + _getId.call(this, 'selectedItem') + '">0</span></span>';
                }
                ctrlbar.append('<div class="status"><span>Item(s) :<span id="' + _getId.call(this, 'totalItem') + '">' +
                    '</span></span>' +
                    t1 +
                    '</div>');
            }
            if (_opt.controlBar.position == 'top') {
                $(me).append(ctrlbar).append(container);
            } else {
                $(me).append(container).append(ctrlbar);
            }

//            _bind.call(this, '#searchInput', 'keyup', function (e) {
//                _self['searchData'].call(me, $(this).val());
//            });
            _bind.call(this, '#search', 'click', function (e) {
                _self['searchData'].call(me, $('#' + _getId.call(_self, 'searchInput')).val());
            });

            _bind.call(this, '#sortAsc', 'click', function (e) {
                _self['sortData'].call(me, 'asc');
            });

            _bind.call(this, '#sortDesc', 'click', function (e) {
                _self['sortData'].call(me, 'desc');
            });

        }


        function _bind(id, eventType, callback) {
            var e = _e.call(this, id);
            if (e.length > 0) {
                e.bind(eventType, callback);
            }
        }


        function _itemClickHandler(ele, label, value) {

            var type = 'onSelect';
            me = $(this);

            if (_opt.type == 'radio') {
                $('.col.selected', this).removeClass('selected');
                ele.addClass('selected');
            } else {
                if (ele.hasClass("selected")) {
                    ele.removeClass("selected");
                    type = 'onDeselect';
                } else {
                    ele.addClass("selected");
                }
            }
            var txt = me.find('span').text();
            _trigger.call(this, type, {
                'context': this,
                'element': ele,
                'item'   : {
                    'label': label,
                    'value': value
                }
            });
        }


        function _trigger(type, data) {
            $(_self).trigger(jQuery.Event(type, data));
            if (type == 'onSelect' || type == 'onDeselect') {
                _selectionHandler.call(this, type, data);
            }
        }


        function _selectionHandler(type, data) {

            _changeStatus.call(this, (type == 'onSelect') ? '+' : '-');

//            if (_opt.useForAjax == true) {
//                return;
//            }
            var ctx = $(data.element);
            if (type == 'onSelect') {
                if (_opt.type == 'checkbox') {

                    var inp = ctx.find('input');
                    if (inp.length > 0) {
                        inp.val(data.item.value);
                    } else {
                        ctx.append($('<input>').attr({
                            'type': 'hidden',
                            'name': $(data.context).attr('data-id') + '[]'
                        }).val(data.item.value));
                    }
                } else {
                    $('#' + $(this).attr('data-id')).val(data.item.value);
                }
            } else {
                if (_opt.type == 'checkbox') {
                    ctx.find('input').remove();
                }
            }

        }


        function _e(name) {
            if (name.substr(0, 1) == '#') {
                name = name.replace(/#/, '');
                name = '#' + _getId.call(this, name);
            }
            return $(name, this);
        }


        function _changeStatus(value) {
            var si = _e.call(this, '#selectedItem')
            var i = parseInt(si.text());
            if (value == '+') {
                i++;
            } else if (value == '-') {
                i--;
            } else {
                i = value;
            }
            si.text(i);
        }


        function _isEmpty(value) {
            return typeof value == 'undefined' || value == null || value == 'null' || value == '';
        }


        return this.each(function () {
            var me = $(this);
            if (me.attr('data-type') != undefined) {
                _opt.type = me.attr('data-type');
            }
            var id = me.attr('data-id');
            me.attr('data-id', _isEmpty(id) ? me.attr('id') + 'Data' : id);
            var cont = $('<div>').addClass('container');
            me.append(cont);
            if (_opt.controlBar.visible == true) {
                _createControlBar.call(this, cont);
            }
            if (_opt.type == 'radio') {
                $(this).append('<input type="hidden" id="' + id + '" name="' + id + '"/>');
            }

            _self.load.call(this);

            me.addClass(_opt.type).data("listbox", _self);

        });


    };


    $.extend($.expr[':'], {
        icontains: function (a, index, meta) {
            return (a.textContent || a.innerText || jQuery(a).text() || "")
                .toLowerCase().indexOf(meta[3].toLowerCase()) >= 0;
        }
    });


})(jQuery);
