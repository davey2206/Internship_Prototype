<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0, height=device-height, target-densitydpi=device-dpi">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
    <title><?php wp_title(); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?> style="margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden;">
    
    <div id="animal-tracker-3d" style="width: 100%; height: 100%;"></div>

    <?php wp_footer(); ?>
</body>

<script type="module">
    import animalTrackerComponent from '<?php echo plugin_dir_url(__FILE__) . 'components/animal_tracker.js'; ?>';

    const app = Vue.createApp({
        components: {
            'animalTrackerComponent': animalTrackerComponent,
        },
        template: `<animalTrackerComponent></animalTrackerComponent>`,
    });

    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('animal-tracker-3d')) {
            app.mount('#animal-tracker-3d');
        }

        //const chatButton = document.getElementById("cky-btn-revisit-wrapper");

        let chaty_disabled = false;
        let mapLayerSelector_disabled = false;
        let fullScreenButton_moved = false;

        const observer = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {

                    // If chatButton hasn't been disabled yet
                    if (!chaty_disabled) {
                        const chatButton = document.querySelector(".cky-btn-revisit-wrapper");

                        if (chatButton) {
                            chatButton.classList.remove("active");
                            chatButton.style.display = 'none';

                            chaty_disabled = true;
                        }
                    }

                    // If mapLayerSelectorElement hasn't been disabled yet
                    // And Tutorial button not moved yet
                    /*
                    if (!mapLayerSelector_disabled) {
                        const toolbarElement = document.getElementsByClassName("cesium-viewer-toolbar");
                        if (toolbarElement) {
                            const tutorialElement = toolbarElement[0].children[2];
                            const headerItemRightElement = document.getElementsByClassName("header-item-right");
                            headerItemRightElement[0].appendChild(tutorialElement);

                            toolbarElement[0].style.setProperty('display', 'none', 'important');
                            mapLayerSelector_disabled = true;
                        }
                    }
                        */
                    if (!mapLayerSelector_disabled) {
                        const toolbarElement = document.getElementsByClassName("cesium-viewer-toolbar");
                        if (toolbarElement) {
                            toolbarElement[0].remove();
                            mapLayerSelector_disabled = true;
                        }
                    }

                    //If Full screen button not moved yet
                    if (!fullScreenButton_moved) {
                        const fullScreenContainer = document.getElementsByClassName("cesium-viewer-fullscreenContainer");
                        if (fullScreenContainer) {
                            //const fullScreenButton = fullScreenContainer[0].children[0];
                            //const footerItemRightElement = document.getElementsByClassName("footer-item-right");
                            //footerItemRightElement[0].appendChild(fullScreenButton);

                            fullScreenContainer[0].style.setProperty('display', 'none', 'important');
                            fullScreenButton_moved = true;
                        }
                    }

                    // If both elements have been handled, disconnect the observer
                    if (chaty_disabled && mapLayerSelector_disabled && fullScreenButton_moved) {
                        observer.disconnect();
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Remove the mouse help section from the cesium help functionality
        modifyCesiumHelpHtml();
    });

    function modifyCesiumHelpHtml() {
        // Find the elements by their class names
        const touchHelpElement = document.querySelector('.cesium-touch-navigation-help');
        const clickHelpElement = document.querySelector('.cesium-click-navigation-help');
        const leftButtonElement = document.querySelector('.cesium-navigation-button-left');
        const rightButtonElement = document.querySelector('.cesium-navigation-button-right');

        // Check if clickHelpElement has the class 'cesium-click-navigation-help-visible'
        if (clickHelpElement && clickHelpElement.classList.contains('cesium-click-navigation-help-visible')) {
            // Remove the class and append display: none !important;
            clickHelpElement.classList.remove('cesium-click-navigation-help-visible');
            clickHelpElement.style.setProperty('display', 'none', 'important');
        }

        // Check if touchHelpElement does NOT have the class 'cesium-touch-navigation-help-visible'
        if (touchHelpElement && !touchHelpElement.classList.contains('cesium-touch-navigation-help-visible')) {
            // Add the class
            touchHelpElement.classList.add('cesium-touch-navigation-help-visible');
        }

        // Check if leftButtonElement has the class 'cesium-navigation-button-selected'
        if (leftButtonElement && leftButtonElement.classList.contains('cesium-navigation-button-selected')) {
            // Remove the class and append display: none !important;
            leftButtonElement.classList.remove('cesium-navigation-button-selected');
            // Disable the button
            leftButtonElement.disabled = true;
            leftButtonElement.style.setProperty('display', 'none', 'important');
        }

        // Check if rightButtonElement does NOT have the class 'cesium-navigation-button-selected'
        if (rightButtonElement && !rightButtonElement.classList.contains('cesium-navigation-button-selected')) {
            // Add the class
            rightButtonElement.classList.add('cesium-navigation-button-selected');
            // Disable the button
            rightButtonElement.disabled = true;
        }
    }

</script>
</html>
