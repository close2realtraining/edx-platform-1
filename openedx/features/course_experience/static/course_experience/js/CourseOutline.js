/* globals Logger */

import { keys } from 'edx-ui-toolkit/js/utils/constants';

// @TODO: Figure out how to make webpack handle default exports when libraryTarget: 'window'
export class CourseOutline {  // eslint-disable-line import/prefer-default-export
  constructor() {
    const focusable = [...document.querySelectorAll('.outline-item.focusable')];

    focusable.forEach(el => el.addEventListener('keydown', (event) => {
      const index = focusable.indexOf(event.target);

      switch (event.key) {  // eslint-disable-line default-case
        case keys.down:
          event.preventDefault();
          focusable[Math.min(index + 1, focusable.length - 1)].focus();
          break;
        case keys.up:  // @TODO: Get these from the UI Toolkit
          event.preventDefault();
          focusable[Math.max(index - 1, 0)].focus();
          break;
      }
    }));

    [...document.querySelectorAll('a:not([href^="#"])')]
      .forEach(link => link.addEventListener('click', (event) => {
        Logger.log(
          'edx.ui.lms.link_clicked',
          {
            current_url: window.location.href,
            target_url: event.currentTarget.href,
          },
        );
      }),
    );

    function expandSection(sectionToggleButton, all_button_selected = false) {
      const $toggleButtonChevron = $(sectionToggleButton).children('.fa-chevron-right');
      const $contentPanel = $(document.getElementById(sectionToggleButton.getAttribute('aria-controls')));

      $contentPanel.slideDown();
      $contentPanel.removeClass('is-hidden');
      $toggleButtonChevron.addClass('fa-rotate-90');
      sectionToggleButton.setAttribute('aria-expanded', 'true');

      // start ET-341 : Hariom
      // Collapse other sections except selected one
      if (all_button_selected == false){
        $(sectionToggleButton).addClass('accordion-active');
        sectionToggleClass(sectionToggleButton);
        var expanded_section = $(document.getElementById(sectionToggleButton.getAttribute("id")));
        if (expanded_section.parent().hasClass("section")) {
          var expanded_section_siblings = expanded_section.parent().siblings();
          if (expanded_section_siblings.length != 0) {
            expanded_section_siblings.each(function () {
              var each_sibling = $(this).find(".section-name");
              if (each_sibling.length != 0) {
                collapseSection(each_sibling[0]);
              }
            });
          }
        }
      } else {
        $(sectionToggleButton).removeClass('accordion-active');
      }
      // end ET-341 : Hariom

    }

    function collapseSection(sectionToggleButton, all_button_selected = false) {
      const $toggleButtonChevron = $(sectionToggleButton).children('.fa-chevron-right');
      const $contentPanel = $(document.getElementById(sectionToggleButton.getAttribute('aria-controls')));

      $contentPanel.slideUp();
      $contentPanel.addClass('is-hidden');
      $toggleButtonChevron.removeClass('fa-rotate-90');
      sectionToggleButton.setAttribute('aria-expanded', 'false');

      $(sectionToggleButton).removeClass('accordion-active');
      if (all_button_selected == false){
        sectionToggleClass(sectionToggleButton);
      }
    }

    function sectionToggleClass(sectionToggleButton) {
      // start ET-339/340 : Hariom
      // sectionToggleButton = $(sectionToggleButton);
      sectionToggleButton = $(document.getElementById(sectionToggleButton.getAttribute("id")));
      if (sectionToggleButton.parent().hasClass('subsection')) {
        // let section = sectionToggleButton.parentsUntil("section").find(".section-name");
        let section = sectionToggleButton.parents(".section").find(".section-name");
        // end ET-339/340 : Hariom
        if (section.hasClass("accordion-active")) {
          section.removeClass("accordion-active");
        } else {
          section.addClass("accordion-active");
        }
      }
    }

    [...document.querySelectorAll(('.accordion'))]
      .forEach((accordion) => {
        const sections = Array.prototype.slice.call(accordion.querySelectorAll('.accordion-trigger'));

        sections.forEach(section => section.addEventListener('click', (event) => {
          const sectionToggleButton = event.currentTarget;
          if (sectionToggleButton.classList.contains('accordion-trigger')) {
            const isExpanded = sectionToggleButton.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
              expandSection(sectionToggleButton);
            } else if (isExpanded) {
              collapseSection(sectionToggleButton);
            }
            event.stopImmediatePropagation();
          }
        }));
      });

    const toggleAllButton = document.querySelector('#expand-collapse-outline-all-button');
    const toggleAllSpan = document.querySelector('#expand-collapse-outline-all-span');
    const extraPaddingClass = 'expand-collapse-outline-all-extra-padding';
    toggleAllButton.addEventListener('click', (event) => {
      const toggleAllExpanded = toggleAllButton.getAttribute('aria-expanded') === 'true';
      let sectionAction;
      /* globals gettext */
      if (toggleAllExpanded) {
        toggleAllButton.setAttribute('aria-expanded', 'false');
        sectionAction = collapseSection;
        toggleAllSpan.classList.add(extraPaddingClass);
        // toggleAllSpan.innerText = gettext('Expand All');
        toggleAllSpan.innerText = 'Alles ausklappen';
      } else {
        toggleAllButton.setAttribute('aria-expanded', 'true');
        sectionAction = expandSection;
        toggleAllSpan.classList.remove(extraPaddingClass);
        // toggleAllSpan.innerText = gettext('Collapse All');
        toggleAllSpan.innerText = 'Alles einklappen';
      }
      const sections = Array.prototype.slice.call(document.querySelectorAll('.accordion-trigger'));
      sections.forEach((sectionToggleButton) => {
        // sectionAction(sectionToggleButton);
        sectionAction(sectionToggleButton, true);
      });
      event.stopImmediatePropagation();
    });

    function setCharLimit(wrapper, el, charLimit) {
      $(wrapper).each(function () {
        var titleEl = $(this).find(el);
        var titleText = titleEl.text().trim();
        var hellip = "";
        var hellip_offset = 3;
        if (titleText.length > charLimit-hellip_offset) {
          // titleEl.html(titleText.slice(0, charLimit) + "&hellip;");
          titleText = titleText.slice(0, charLimit);
          hellip = "&hellip;";
        }
        // adjusting words in two lines
        var inputArr = titleText.split(" ");
        var outputArr = [];
        var wordLength = 0;
        var totalChars = 0;
        var line1Exhausted = false;
        var line2Exhausted = false;
        var maxCharsInLine = charLimit/2;
        for (var word of inputArr) {
          wordLength = word.length;
          totalChars += wordLength;
          // break the loop if all the lines are exhausted
          if (line1Exhausted && line2Exhausted) {
            break;
          }
          // console.log(word, wordLength, totalChars, maxCharsInLine);
          // if line 1 is not exhausted then accumulate words until line1 is exhausted
          if (!line1Exhausted){
            // if total chars including current word length is more the line1 limit then move the word to next line
            if (totalChars > maxCharsInLine) {
              line1Exhausted = true;
              totalChars = wordLength;
            } else {
              outputArr.push(word);
            }
          // if line1 is exhausted and line 2 is not then accumulate words until line2 is exhausted
          }
          if (line1Exhausted && !line2Exhausted){
            if (totalChars >= maxCharsInLine) {
              var endpos = wordLength - (totalChars-maxCharsInLine) - hellip_offset;
              if (endpos > 0) {
                outputArr.push(word.slice(0,endpos)+"&hellip;");
              }
              line2Exhausted = true;
            } else {
              outputArr.push(word);
            }
          }
          totalChars += 1;
        }

        titleText = outputArr.join(" ");
        if (!titleText.includes("&hellip;") && titleText!="") {
          titleText += hellip;
        }
        titleEl.html(titleText);
      });
    }

    function setTOCCharLimit() {
      var sectionLimit = 140, subsectionLimit = 140, unitLimit = 140;
      if ($(window).width() <= 667) {
        // width 568 chars
        sectionLimit = 102;
        subsectionLimit = 102;
        unitLimit = 102;
      }
      if ($(window).width() <= 567) {
        // width 480 chars
        sectionLimit = 64;
        subsectionLimit = 60;
        unitLimit = 54;
      }
      // if ($(window).width() <= 479) {
      if ($(window).width() <= 410) {
        // width 320 chars
        sectionLimit = 54;
        subsectionLimit = 52;
        unitLimit = 44;
      }
      setCharLimit(".section-name", ".section-title", sectionLimit);
      setCharLimit(".subsection-text", ".subsection-title", subsectionLimit);
      setCharLimit(".last-level-title", ".vertical-details", unitLimit);
    }

    setTOCCharLimit();

    const urlHash = window.location.hash;

    if (urlHash !== '') {
      const button = document.getElementById(urlHash.substr(1, urlHash.length));
      if (button.classList.contains('subsection-text')) {
        const parentLi = button.closest('.section');
        const parentButton = parentLi.querySelector('.section-name');
        expandSection(parentButton);
      }
      expandSection(button);
    }
  }
}
