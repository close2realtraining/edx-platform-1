(function(define) {
    'use strict';
    /**
     * Completion handler
     * @exports video/09_completion.js
     * @constructor
     * @param {Object} state The object containing the state of the video
     * @return {jquery Promise}
     */
    define('video/09_completion.js', [], function() {
        var VideoCompletionHandler = function(state) {
            if (!(this instanceof VideoCompletionHandler)) {
                return new VideoCompletionHandler(state);
            }
            this.state = state;
            this.state.completionHandler = this;
            this.initialize();
            return $.Deferred().resolve().promise();
        };

        VideoCompletionHandler.prototype = {

            /** Tears down the VideoCompletionHandler.
             *
             *  * Removes backreferences from this.state to this.
             *  * Turns off signal handlers.
             */
            destroy: function() {
                this.el.remove();
                this.el.off('timeupdate.completion');
                this.el.off('ended.completion');
                delete this.state.completionHandler;
            },

            /** Initializes the VideoCompletionHandler.
             *
             *  This sets all the instance variables needed to perform
             *  completion calculations.
             */
            initialize: function() {
                // Attributes with "Time" in the name refer to the number of seconds since
                // the beginning of the video, except for lastSentTime, which refers to a
                // timestamp in seconds since the Unix epoch.
                this.lastSentTime = undefined;
                this.isComplete = false;
                this.completionPercentage = this.state.config.completionPercentage;
                this.startTime = this.state.config.startTime;
                this.endTime = this.state.config.endTime;
                this.isEnabled = this.state.config.completionEnabled;
                if (this.endTime) {
                    this.completeAfterTime = this.calculateCompleteAfterTime(this.startTime, this.endTime);
                }
                if (this.isEnabled) {
                    this.bindHandlers();
                }
            },

            /** Bind event handler callbacks.
             *
             *  When ended is triggered, mark the video complete
             *  unconditionally.
             *
             *  When timeupdate is triggered, check to see if the user has
             *  passed the completeAfterTime in the video, and if so, mark the
             *  video complete.
             *
             *  When destroy is triggered, clean up outstanding resources.
             */
            bindHandlers: function() {
                var self = this;

                /** Event handler to check if the video is complete, and submit
                 *  a completion if it is.
                 *
                 *  If the timeupdate handler doesn't fire after the required
                 *  percentage, this will catch any fully complete videos.
                 */
                this.state.el.on('ended.completion', function() {
                    self.handleEnded();
                });

                /** Event handler to check video progress, and mark complete if
                 *  greater than completionPercentage
                 */
                this.state.el.on('timeupdate.completion', function(ev, currentTime) {
                    self.handleTimeUpdate(currentTime);
                });

                /** Event handler to receive youtube metadata (if we even are a youtube link),
                 *  and mark complete, if youtube will insist on hosting the video itself.
                 */
                this.state.el.on('metadata_received', function() {
                    self.checkMetadata();
                });

                /** Event handler to clean up resources when the video player
                 *  is destroyed.
                 */
                this.state.el.off('destroy', this.destroy);
            },

            /** Handler to call when the ended event is triggered */
            handleEnded: function() {
                if (this.isComplete) {
                    return;
                }
                this.markCompletion();
            },

            /** Handler to call when a timeupdate event is triggered */
            handleTimeUpdate: function(currentTime) {
                var duration;
                if (this.isComplete) {
                    return;
                }
                if (this.lastSentTime !== undefined && currentTime - this.lastSentTime < this.repostDelaySeconds()) {
                    // Throttle attempts to submit in case of network issues
                    return;
                }
                if (this.completeAfterTime === undefined) {
                    // Duration is not available at initialization time
                    duration = this.state.videoPlayer.duration();
                    if (!duration) {
                        // duration is not yet set. Wait for another event,
                        // or fall back to 'ended' handler.
                        return;
                    }
                    this.completeAfterTime = this.calculateCompleteAfterTime(this.startTime, duration);
                }

                if (currentTime > this.completeAfterTime) {
                    this.markCompletion(currentTime);
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

                // console.log(toc_progress);

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

            /** Handler to call when youtube metadata is received */
            checkMetadata: function() {
                var metadata = this.state.metadata[this.state.youtubeId()];

                // https://developers.google.com/youtube/v3/docs/videos#contentDetails.contentRating.ytRating
                if (metadata && metadata.contentRating && metadata.contentRating.ytRating === 'ytAgeRestricted') {
                    // Age-restricted videos won't play in embedded players. Instead, they ask you to watch it on
                    // youtube itself. Which means we can't notice if they complete it. Rather than leaving an
                    // incompletable video in the course, let's just mark it complete right now.
                    if (!this.isComplete) {
                        this.markCompletion();
                    }
                }
            },

            /** Submit completion to the LMS */
            markCompletion: function(currentTime) {
                var self = this;
                var errmsg;
                this.isComplete = true;
                this.lastSentTime = currentTime;
                if (this.state.config.publishCompletionUrl) {
                    $.ajax({
                        type: 'POST',
                        url: this.state.config.publishCompletionUrl,
                        contentType: 'application/json',
                        dataType: 'json',
                        // data: JSON.stringify({completion: 1.0}),
                        // success: function() {
                        data: JSON.stringify({completion: 1.0,user_info: $.cookie("edx-user-info")}),
                        success: function(responseData) {
                            self.state.el.off('timeupdate.completion');
                            self.state.el.off('ended.completion');
                            self.updateTOCProgressIcon(responseData["toc_progress"])
                        },
                        error: function(xhr) {
                            /* eslint-disable no-console */
                            self.complete = false;
                            errmsg = 'Failed to submit completion';
                            if (xhr.responseJSON !== undefined) {
                                errmsg += ': ' + xhr.responseJSON.error;
                            }
                            console.warn(errmsg);
                            /* eslint-enable no-console */
                        }
                    });
                } else {
                    /* eslint-disable no-console */
                    console.warn('publishCompletionUrl not defined');
                    /* eslint-enable no-console */
                }
            },

            /** Determine what point in the video (in seconds from the
             *  beginning) counts as complete.
             */
            calculateCompleteAfterTime: function(startTime, endTime) {
                return startTime + (endTime - startTime) * this.completionPercentage;
            },

            /** How many seconds to wait after a POST fails to try again. */
            repostDelaySeconds: function() {
                return 3.0;
            }
        };
        return VideoCompletionHandler;
    });
}(RequireJS.define));
