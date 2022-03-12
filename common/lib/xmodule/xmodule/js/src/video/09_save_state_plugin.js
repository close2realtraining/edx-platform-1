(function(define) {
    'use strict';
    define('video/09_save_state_plugin.js', ['underscore', 'time.js'], function(_, Time) {
    /**
     * Save state module.
     * @exports video/09_save_state_plugin.js
     * @constructor
     * @param {Object} state The object containing the state of the video
     * @param {Object} i18n The object containing strings with translations.
     * @param {Object} options
     * @return {jquery Promise}
     */
        var SaveStatePlugin = function(state, i18n, options) {
            if (!(this instanceof SaveStatePlugin)) {
                return new SaveStatePlugin(state, i18n, options);
            }

            _.bindAll(this, 'onSpeedChange', 'onAutoAdvanceChange', 'saveStateHandler', 'bindUnloadHandler', 'onUnload',
            'onYoutubeAvailability', 'onLanguageChange', 'destroy');
            this.state = state;
            this.options = _.extend({events: []}, options);
            this.state.videoSaveStatePlugin = this;
            this.i18n = i18n;
            this.initialize();

            return $.Deferred().resolve().promise();
        };


        SaveStatePlugin.moduleName = 'SaveStatePlugin';
        SaveStatePlugin.prototype = {
            destroy: function() {
                this.state.el.off(this.events).off('destroy', this.destroy);
                $(window).off('unload', this.onUnload);
                delete this.state.videoSaveStatePlugin;
            },

            initialize: function() {
                this.events = {
                    speedchange: this.onSpeedChange,
                    autoadvancechange: this.onAutoAdvanceChange,
                    play: this.bindUnloadHandler,
                    'pause destroy': this.saveStateHandler,
                    'language_menu:change': this.onLanguageChange,
                    youtube_availability: this.onYoutubeAvailability
                };
                this.bindHandlers();
            },

            bindHandlers: function() {
                if (this.options.events.length) {
                    _.each(this.options.events, function(eventName) {
                        var callback;
                        if (_.has(this.events, eventName)) {
                            callback = this.events[eventName];
                            this.state.el.on(eventName, callback);
                        }
                    }, this);
                } else {
                    this.state.el.on(this.events);
                }
                this.state.el.on('destroy', this.destroy);
            },

            bindUnloadHandler: _.once(function() {
                $(window).on('unload.video', this.onUnload);
            }),

            onSpeedChange: function(event, newSpeed) {
                this.saveState(true, {speed: newSpeed});
                this.state.storage.setItem('speed', newSpeed, true);
                this.state.storage.setItem('general_speed', newSpeed);
            },

            onAutoAdvanceChange: function(event, enabled) {
                this.saveState(true, {auto_advance: enabled});
                this.state.storage.setItem('auto_advance', enabled);
            },

            saveStateHandler: function() {
                this.saveState(true);
            },

            onUnload: function() {
                this.saveState();
            },

            onLanguageChange: function(event, langCode) {
                this.state.storage.setItem('language', langCode);
            },

            onYoutubeAvailability: function(event, youtubeIsAvailable) {
            // Compare what the client-side code has determined Youtube
            // availability to be (true/false) vs. what the LMS recorded for
            // this user. The LMS will assume YouTube is available by default.
                if (youtubeIsAvailable !== this.state.config.recordedYoutubeIsAvailable) {
                    this.saveState(true, {youtube_is_available: youtubeIsAvailable});
                }
            },

            // Start Hariom : ET-183_TOC_changes
            started : "fa-check-partially-circle",
            complete : "fa-check-circle",

            get_subsection_progress: function(current_unit) {
                var that = this;
                var status;
                var current_unit_siblings = current_unit.siblings();
                if (current_unit_siblings.length != 0){
                    current_unit_siblings.each(function () {
                        var this_icon = $(this).children("a").children("button.last-level-title").children("span.complete-checkmark");
                        if (this_icon.hasClass(that.complete)) {
                            status = that.complete;
                            return true;
                        } else {
                            status = that.started;
                            return false;
                        }
                    });
                } else {
                    status = that.complete;
                }
                return status;
            },

            get_section_progress: function(current_subsection, current_subsection_progress){
                var that = this;
                var status;
                var current_subsection_siblings = current_subsection.siblings();
                if (current_subsection_siblings.length != 0){
                    current_subsection_siblings.each(function () {
                        var this_icon = $(this).children("button.subsection-text.accordion-trigger").children("span.complete-checkmark");
                        if (this_icon.hasClass(that.complete)) {
                            status = that.complete;
                            return true;
                        } else {
                            status = that.started;
                            return false;
                        }
                    });
                } else {
                    // if subsection has no sibling i.e. section has only one subsection then section's progress = subsection's progress
                    status = current_subsection_progress;
                }
                return status;
            },

            updateTOCProgressIcon: function (toc_progress) {
                var that = this;



                var unit_progress, subsection_progress, section_progress;
                unit_progress = subsection_progress = section_progress = '';

                var active_unit, active_unit_atag, active_unit_id, active_unit_icon;
                var active_subsection, active_subsection_icon, active_section, active_section_icon;

                active_unit = $("li.vertical.current");
                active_unit_atag = active_unit.find("a.outline-item.focusable.clearfix");
                active_unit_id = active_unit_atag.attr("id");
                active_unit_icon = active_unit_atag.find("button.last-level-title.current span.complete-checkmark")

                active_subsection = $("li.subsection.current");
                active_subsection_icon = active_subsection.find("button.subsection-text.accordion-trigger span.complete-checkmark");

                active_section = $("li.section.current");
                active_section_icon = active_section.find("button.section-name.accordion-trigger span.complete-checkmark");

                if (active_unit_id == toc_progress['block_id']){
                    // get progress for unit, subsection, section
                    if (toc_progress["status"] == "Started"){
                        unit_progress = that.started
                        subsection_progress = that.started
                        section_progress = that.started
                    } else if (toc_progress["status"] == "Complete"){
                        unit_progress = that.complete
                        // If all the sibling units are complete -> update subsection = complete else started
                        subsection_progress = that.get_subsection_progress(active_unit)
                        // If all the sibling subsections are complete -> update section = complete else subsection_progress
                        section_progress = that.get_section_progress(active_subsection, subsection_progress)
                    }
                    // update progress icon

                    if (unit_progress != ''){
                        active_unit_icon.addClass(unit_progress)
                    }

                    if (subsection_progress != ''){
                        active_subsection_icon.addClass(subsection_progress)
                    }

                    if (section_progress != ''){
                        active_section_icon.addClass(section_progress)
                    }
                };

            },
            // End Hariom : ET-183_TOC_changes

            saveState: function(async, data) {
                var that = this;
                if (this.state.config.saveStateEnabled) {
                    if (!($.isPlainObject(data))) {
                        data = {
                            // saved_video_position: this.state.videoPlayer.currentTime
                            completion_time: this.state.completionHandler.completeAfterTime,
                            saved_video_position: this.state.videoPlayer.currentTime,
                            user_info: $.cookie("edx-user-info")
                        };
                    }

                    if (data.speed) {
                        this.state.storage.setItem('speed', data.speed, true);
                    }

                    if (_.has(data, 'saved_video_position')) {
                        this.state.storage.setItem('savedVideoPosition', data.saved_video_position, true);
                        data.saved_video_position = Time.formatFull(data.saved_video_position);
                    }

                    $.ajax({
                        url: this.state.config.saveStateUrl,
                        type: 'POST',
                        async: !!async,
                        dataType: 'json',
                        data: data,
                        // Start Hariom : ET-183_TOC_changes
                        success: function success(responseData) {

                        }
                        // End Hariom : ET-183_TOC_changes
                    });

                    function getSeconds(custime){
                        var ar=custime.split(":")
                        ar=ar.reverse()
                        var secs=0
                        var i;
                        for (i=0; i < ar.length; i++){
                            secs+=Math.pow(60,i)*ar[i]
                        }
                        return secs
                    }
                    var complete=0.0;
                    if ((data.saved_video_position > "00:00:00") && (this.state.config.publishCompletionUrl)) {
                        var block_id=this.state.config.publishCompletionUrl.split("/")[4];
                        var endt=$("[data-id='"+block_id+"']").find(".vidtime")[0].textContent.split(" / ")[1];
                        var duration=getSeconds(endt); 
                        var visited=getSeconds(data.saved_video_position);  
                        // var completeaftertime = 22;
                        if (!this.state.completionHandler.completeAfterTime)
                            var completeaftertime=this.state.completionHandler.calculateCompleteAfterTime(this.state.completionHandler.startTime, duration)    
                        else
                        var completeaftertime= this.state.completionHandler.completeAfterTime; 
                        if (visited > completeaftertime){
                            complete=1.0
                        }
                        else {
                            if (visited > 0){
                                complete=0.5
                            }
                        }
                        $.ajax({
                            type: 'POST',
                            url: this.state.config.publishCompletionUrl,
                            contentType: 'application/json',
                            dataType: 'json',
                            data: JSON.stringify({completion: complete,user_info: $.cookie("edx-user-info")}),
                            success: function(responseData) {
                                if (complete == 1.0){
                                self.state.el.off('timeupdate.completion');
                                self.state.el.off('ended.completion');
                                }
                                that.updateTOCProgressIcon(responseData["toc_progress"])
                            },       
                            error: function(xhr) {
                                /* eslint-disable no-console */
                                self.state.completionHandler.complete = false;
                                var errmsg = 'Failed to submit completion';
                                if (xhr.responseJSON !== undefined) {
                                    errmsg += ': ' + xhr.responseJSON.error;
                                }
                                console.warn(errmsg);
                                /* eslint-enable no-console */
                            }
                        });
                    }                
                }
            }
        };

        return SaveStatePlugin;
    });
}(RequireJS.define));
