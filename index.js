/**
 * Скрипт для роботи з завантаженням файла
 *
 * @author      Артем Висоцький <a.vysotsky@gmail.com>
 * @package     Upload
 * @link        http://upload.local
 * @copyright   Всі права застережено (c) 2019 Upload
 */

let url = new URL();
const DEBUG = (url.isParam('debug') && (url.getParam('debug') === '1'));
if (DEBUG) console.log('debug mode on');

$(document).ready(function(){
    let file = timer = null;
    let upload = null;
    const limit = 10 * 1048576;
    const nodes = new function() {
        this.main = $('main');
        this.warning = this.main.find('p.warning');
        this.form = this.main.find('form');
        this.formControl = this.form.find('div.control');
        this.formMonitor = this.form.find('div.monitor');
        this.fileButton = this.form.find('input.file');
        this.uploadButton = this.formControl.find('input.upload');
        this.pauseButton = this.formControl.find('input.pause');
        this.resumeButton = this.formControl.find('input.resume');
        this.cancelButton = this.formControl.find('input.cancel');
        this.sizeTotalIndicator = this.formMonitor.find('input.sizeTotal');
        this.sizeUploadedIndicator = this.formMonitor.find('input.sizeUploaded');
        this.percentIndicator = this.formMonitor.find('input.percent');
        this.speedIndicator = this.formMonitor.find('input.speed');
        this.timeElapsedIndicator = this.formMonitor.find('input.timeElapsed');
        this.timeEstimateIndicator = this.formMonitor.find('input.timeEstimate');
    };
    nodes.warning.hide();
    nodes.main.find('div.form').show();
    nodes.fileButton.change(function() {
        file = $(this)[0].files[0];
        if (file === undefined) return false;
        if (file.size > limit) {
            alert('Розмір файлу більше допустимого');
            return;
        }
        nodes.form[0].reset();
        nodes.uploadButton.removeAttr('disabled');
        nodes.sizeTotalIndicator.val(Human.getSize(file.size));
        upload = new Upload(file, {timeout: 3000, retry: {interval: 3000, limit: 5}, debug: DEBUG});
        upload.addListener('start', function() {
            nodes.uploadButton.attr('disabled', 'disabled');
            nodes.pauseButton.removeAttr('disabled');
            nodes.cancelButton.removeAttr('disabled');
            timer = setInterval(updateIndicators, 1000);
        });
        upload.addListener('pause', function() {
            nodes.pauseButton.attr('disabled', 'disabled');
            nodes.resumeButton.removeAttr('disabled');
        });
        upload.addListener('resume',function() {
            nodes.resumeButton.attr('disabled', 'disabled');
            nodes.pauseButton.removeAttr('disabled');
        });
        upload.addListener('stop', function() {
            nodes.uploadButton.attr('disabled', 'disabled');
            nodes.pauseButton.attr('disabled', 'disabled');
            nodes.resumeButton.attr('disabled', 'disabled');
            nodes.cancelButton.attr('disabled', 'disabled');
            nodes.form[0].reset();
            clearInterval(timer);
            updateIndicators();
        });
        upload.addListener('fail', function() {
            nodes.uploadButton.attr('disabled', 'disabled');
            nodes.pauseButton.attr('disabled', 'disabled');
            nodes.resumeButton.attr('disabled', 'disabled');
            clearInterval(timer);
            updateIndicators();
            alert('Помилка! ' + upload.getError());
         });
        upload.addListener('finish', function() {
            nodes.pauseButton.attr('disabled', 'disabled');
            nodes.resumeButton.attr('disabled', 'disabled');
            nodes.cancelButton.attr('disabled', 'disabled');
            clearInterval(timer);
            updateIndicators();
        });
    });

    nodes.uploadButton.click(function() {upload.start();});
    nodes.pauseButton.click(function() {upload.pause();});
    nodes.resumeButton.click(function() {upload.resume();});
    nodes.cancelButton.click(function() {upload.stop();});

    function updateIndicators() {
        let indicators = upload.getIndicators();
        nodes.sizeUploadedIndicator.val(Human.getSize(indicators.sizeUploaded));
        nodes.percentIndicator.val(indicators.percent + ' %');
        nodes.speedIndicator.val(Human.getSize(indicators.speed) + '/c');
        nodes.timeElapsedIndicator.val(Human.getTime(indicators.timeElapsed));
        nodes.timeEstimateIndicator.val(Human.getTime(indicators.timeEstimate));
    }
});




function URL() {
    const url = window.location.search.substring(1);
    const paramsString = url.split('&');
    let params = {};
    paramsString.forEach(function(param) {
        let paramCurrent = param.split('=');
        params[paramCurrent[0]] = paramCurrent[1];
    });
    this.isParam = function(name) {
        return (params[name] !== undefined);
    };
    this.getParam = function(name) {
        return (this.isParam(name)) ? params[name] : null;
    };
}


class Human {
    static getSize(bytes) {
        const thousand = 1000;
        if(Math.abs(bytes) < thousand) return bytes + ' B';
        let i = -1;
        const units = ['КБ','МБ','ГБ'];
        do {bytes /= thousand; ++i;
        } while(Math.abs(bytes) >= thousand && i < units.length - 1);
        return bytes.toFixed(1)+' '+units[i];
    }
    static getTime(interval) {
        let hours = Math.floor(((interval % 31536000) % 86400) / 3600);
        let minutes = Math.floor((((interval % 31536000) % 86400) % 3600) / 60);
        let seconds = (((interval % 31536000) % 86400) % 3600) % 60;
        if (hours.toString().length === 1) hours = '0' + hours;
        if (minutes.toString().length === 1) minutes = '0' + minutes;
        if (seconds.toString().length === 1) seconds = '0' + seconds;
        return hours + ':' + minutes + ':' + seconds;
    }
}
