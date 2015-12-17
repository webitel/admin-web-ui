define('modalBox', [], function() {

    var ModalBox = {

        $cover: $('.cfd-modal-box-cover'),
        $box: $('.cfd-modal-box'),
        $header: $('.cdf-modal-box-header'),
        $title: $('.cfd-modal-box-title'),
        $close: $('.cfd-modal-box-close'),
        $content: $('.cfd-modal-box-content'),

        defaultConfig: {
            width: '600px',
            height: '400px',
            title: 'Modal box'
        },

        init: function() {
            this.$close.on('click', this.hide.bind(this));
            this.$cover.on('resize', this.moveBox.bind(this));
        },

        moveBox: function() {
            this.$box.css({
                left: ((this.$cover.width() / 2) - (this.$box.width() / 2)) + 'px',
                top: ((this.$cover.height() / 2) - (this.$box.height() / 2)) + 'px'
            });
        },

        show: function(config) {

            config = config || {};
            config = $.extend(true, {}, this.defaultConfig, config);

            this.$title.text(config.title);

            this.$cover.show();

            this.$box.css({
                width: config.width,
                height: config.height
            }).show();

            this.moveBox();
        },

        hide: function() {
            this.$cover.hide();
            this.$box.hide();
        }

    };

    ModalBox.init();

    return ModalBox;

});