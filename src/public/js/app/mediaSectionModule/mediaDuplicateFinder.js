/**
 * Created by s.fedyuk on 04.02.2016.
 */
define("mediaDuplicateFinder", ["jquery"], function(jquery) {

    // получити список назв всіх наявних медіа файлів
    function getAudioList() {

        var availableAudioNames = [];

        var audioListSize = jquery("#list .audioName").length;

        for(var i = 0; i < audioListSize; i++) {

            availableAudioNames[i] = jquery("#list .audioName:eq(" + i + ")").text();
        }

        return availableAudioNames;
    }

    // повертає чи є дана назва файлу у списку медіа файлів
    function isExistAudioName(audioName) {

        // список назв наявних медіа файлів
        var audioList = getAudioList();

        for(var i = 0; i < audioList.length; i++) {

            // якщо така назва медіа файлу вже існує
            if(audioList[i] === audioName) {
                return true;
            }
        }

        return false;
    }

    return {

        getAudioList: getAudioList,
        isExistsAudioName: isExistAudioName
    }
});