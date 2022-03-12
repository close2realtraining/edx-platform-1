/**
 * Simple image input
 *
 *
 * Click on image. Update the coordinates of a dot on the image.
 * The new coordinates are the location of the click.
 */

/**
 * 'The wise adapt themselves to circumstances, as water molds itself to the
 * pitcher.'
 *
 * ~ Chinese Proverb
 */

// Start Hariom - ET-243 changes
var active_slick, image_input_id, image_ref, div_ref, cross_img_ref, answer_div_ref, canvas_ref;
var resized_img_probs = {};
var orig_img_dim = {"width": 0, "height": 0, "ratio": 0};
var orig_cross_img_properties = {"top": 0, "left": 0, "topratio": 0, "leftratio": 0};
var updated_width, updated_height;

function get_elem_dim(obj_ref){
    var obj_width = parseFloat(obj_ref.width());
    var obj_height = parseFloat(obj_ref.height());
    return {"width": obj_width, "height": obj_height}
};

function hide_orig_img(){
    if (image_input_id !== undefined){
        answer_div_ref.addClass("hide");
        image_ref.addClass("hide");
        spinner_ref.removeClass("hide");
    }
};

function show_orig_img(){
    if (image_input_id !== undefined){
        spinner_ref.addClass("hide");
        image_ref.removeClass("hide");
        answer_div_ref.removeClass("hide");
    }
};

function resize_image_mapped_problem(){
    active_slick = image_input_id = image_ref = div_ref = cross_img_ref = answer_div_ref = canvas_ref = '';
    active_slick = $("div.slick-current.slick-active").find("input.imageinput");
    image_input_id = active_slick.attr("id");
    // console.log("--------------------------");
    // console.log("working on id: ", image_input_id);
    if (image_input_id) {
        // Fetch element ref
        image_ref = $("div#image" + image_input_id);
        spinner_ref = $("#spinner_image" + image_input_id);
        div_ref = $("div#div_image" + image_input_id);
        cross_img_ref = image_ref.find("img#" + image_input_id.replace("input", "cross"));
        answer_div_ref = div_ref.find("div#" + image_input_id.replace("input", "answer"));
        canvas_ref = answer_div_ref.find("canvas");

        // show spinner and hide original image until image is properly loaded and resized
        hide_orig_img();

        // fetch image div dimensions and store them if not already stored
        var image_dim = get_elem_dim(image_ref);
        // fetch dimensions of parent of image div - No need to store dimensions as these will be changing on resize
        var div_dim = get_elem_dim(div_ref);
        // fetch and store (if not already) the original top, left positions and respective img window ratio of cross icon
        var cross_img_properties = {"top": parseFloat(cross_img_ref.css("top")), "left": parseFloat(cross_img_ref.css("left"))}

        // Fetch original image properties either from storage or from active element
        orig_img_dim = { "width": 0, "height": 0, "ratio": 0 };
        orig_cross_img_properties = { "top": 0, "left": 0, "topratio": 0, "leftratio": 0 };
        if (!(image_input_id in resized_img_probs)) {
            if (orig_img_dim["width"] == 0 || orig_img_dim["height"] == 0) {
                orig_img_dim["width"] = image_dim["width"];
                orig_img_dim["height"] = image_dim["height"];
            }
            if (orig_cross_img_properties["top"] == 0 || orig_cross_img_properties["left"] == 0) {
                orig_cross_img_properties["top"] = cross_img_properties["top"]+15;
                orig_cross_img_properties["left"] = cross_img_properties["left"]+15;
            }
        } else {
            orig_img_dim = resized_img_probs[image_input_id]["orig_img_dim"];
            orig_cross_img_properties = resized_img_probs[image_input_id]["orig_cross_img_properties"];
        }

        // calculate original image dimension ratios
        if (orig_img_dim["height"] != 0 && orig_img_dim["ratio"] == 0) {
            orig_img_dim["ratio"] = orig_img_dim["width"] / orig_img_dim["height"];
        }
        // if ((orig_cross_img_properties["topratio"] == 0 || orig_cross_img_properties["leftratio"] == 0) && orig_img_dim["height"] != 0 && orig_img_dim["width"] != 0) {
        if (orig_img_dim["height"] != 0 && orig_img_dim["width"] != 0) {
            orig_cross_img_properties["topratio"] = orig_cross_img_properties["top"] / orig_img_dim["height"];
            orig_cross_img_properties["leftratio"] = orig_cross_img_properties["left"] / orig_img_dim["width"];
        }

        // get updated width based on resized window
        if (div_dim["width"] <= image_dim["width"]) {
            updated_width = div_dim["width"];
        } else {
            updated_width = Math.min(div_dim["width"], orig_img_dim["width"]);
        }
        // get updated height based on resized window and original image ratio
        if (orig_img_dim["ratio"] != 0) {
            updated_height = Math.round(updated_width / orig_img_dim["ratio"]);
        } else {
            updated_height = orig_img_dim["height"];
        }

        // Start Debugging
        // console.log("orig_img_dim", orig_img_dim);
        // console.log("image_dim", image_dim);
        // console.log("orig_cross_img_properties", orig_cross_img_properties);
        // console.log("cross_img_properties", cross_img_properties);
        // console.log("div_dim", div_dim);
        // console.log(updated_width, updated_height);
        // End Debugging

        // update width and height of elements
        image_ref.width(updated_width);
        image_ref.height(updated_height);
        answer_div_ref.attr("data-width", updated_width);
        answer_div_ref.attr("data-height", updated_height);
        var left = Math.round(updated_width * orig_cross_img_properties["leftratio"])-15;
        var top = Math.round(updated_height * orig_cross_img_properties["topratio"])-15;
        cross_img_ref.css("left", (left < 0) ? 0 : left);
        cross_img_ref.css("top", (top < 0) ? 0 : top);
        if (canvas_ref.length != 0) {
            canvas_ref.width(updated_width);
            canvas_ref.height(updated_height);
        }
        // hide spinner and show original image once image is properly loaded and resized
        show_orig_img();

        // track images already resized
        if (!(image_input_id in resized_img_probs)) {
            resized_img_probs[image_input_id] = {
                "orig_img_dim": orig_img_dim,
                "orig_cross_img_properties": orig_cross_img_properties 
            };
        }
    }
};

$(document).ready( function(){
    if ($(".xblock-student_view-assessmentxblock").data("runtime-class") == "LmsRuntime") {

        $(window).on("resize", function(){
            hide_orig_img();
            setTimeout(resize_image_mapped_problem, 500);
        });

        $("#main").on("AssessmentXBlock:slideChanged", function(){
            // console.log("slick cliked");
            hide_orig_img();
            resize_image_mapped_problem();
        });

        $("#main").on("AssessmentXBlock:problemSubmited", function(){
            // console.log("submittted");
            resize_image_mapped_problem();
        });

        setTimeout(resize_image_mapped_problem, 1000);
    }
});

// End Hariom - ET-243 changes

window.ImageInput = (function($, undefined) {
    var ImageInput = ImageInputConstructor;

    ImageInput.prototype = {
        constructor: ImageInputConstructor,
        clickHandler: clickHandler
    };

    return ImageInput;

    function ImageInputConstructor(elementId) {
        this.el = $('#imageinput_' + elementId);
        this.crossEl = $('#cross_' + elementId);
        this.inputEl = $('#input_' + elementId);

        if ($(".xblock-student_view-assessmentxblock").data("runtime-class") != "LmsRuntime") {
            $('#spinner_imageinput_' + elementId).addClass("hide");
            this.el.removeClass("hide");
            $('#answer_' + elementId).removeClass("hide");
        }

        this.el.on('click', this.clickHandler.bind(this));
    }

    function clickHandler(event) {
        var offset = this.el.offset(),
            posX = event.offsetX ?
                event.offsetX : event.pageX - offset.left,
            posY = event.offsetY ?
                event.offsetY : event.pageY - offset.top,

            // To reduce differences between values returned by different kinds
            // of browsers, we round `posX` and `posY`.
            //
            // IE10: `posX` and `posY` - float.
            // Chrome, FF: `posX` and `posY` - integers.
            result = '[' + Math.round(posX) + ',' + Math.round(posY) + ']';

        // Start Hariom - ET-243 changes
        // console.log("old_result: ", result);    // Debugging Purpose
        if (orig_img_dim && updated_width && updated_height){
            var newPosX, newPosY;
            if (orig_img_dim["width"]){
                newPosX = Math.round(orig_img_dim["width"] * (posX/updated_width));
            }
            if (orig_img_dim["height"]){
                newPosY = Math.round(orig_img_dim["height"] * (posY/updated_height));
            }
            if (newPosX && newPosY){
                resized_img_probs[image_input_id]["orig_cross_img_properties"]["left"] = newPosX;
                resized_img_probs[image_input_id]["orig_cross_img_properties"]["top"] = newPosY;
                result = '[' + newPosX + ',' + newPosY + ']';
            }
        }
        // console.log("new_result: ", result);    // Debugging Purpose
        // End Hariom - ET-243 changes

        this.crossEl.css({
            left: posX - 15,
            top: posY - 15,
            visibility: 'visible'
        });

        this.inputEl.val(result);
    }
}).call(this, window.jQuery);
