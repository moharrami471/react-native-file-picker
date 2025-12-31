import React, { Component } from 'react';
import {
    View,
    Platform,
    PermissionsAndroid,
    Alert,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image, TouchableWithoutFeedback, Animated, Linking, ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Button, Text} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import fontelloConfig from '../config.json';
import {token} from './splash';
import RNFetchBlob from 'react-native-fetch-blob';
import {ProgressDialog, TouchableEffect} from 'react-native-simple-dialogs';
import ImagePicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
const LocalIcon = createIconSetFromFontello(fontelloConfig);
import FileViewer from 'react-native-file-viewer';
import Axios from 'axios';
import ProgressBar from 'react-native-progress/Bar';
import ImagePicker2 from 'react-native-image-picker';
import FIcon from 'react-native-vector-icons/FontAwesome';
import publicStyles from '../css/public';
import stylesPage from '../css/homeworkArchiveItem';
import ParsedText from 'react-native-parsed-text';
import {mainColors} from '../config/global';
import attachDn from '../img1/DownloadAttachment.png';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    Player,
    Recorder,
    MediaStates,
} from '@react-native-community/audio-toolkit';
import RIcon from 'react-native-vector-icons/Entypo';
import VoicePlayerPart from './voicePlayerPart';
import Communications from 'react-native-communications';
import IIcon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import SIcon from 'react-native-vector-icons/SimpleLineIcons';
import ENIcon from 'react-native-vector-icons/Entypo';
import {normalize} from './SideBar';
const WWW_URL_PATTERN = /^www\./i;
let rec = null;
let miliRef = null;
let secondRef = null;
let minRef = null;

class HomeworkArchiveItem extends Component {
    constructor(props){
        super(props);

        // FIX 1: جلوگیری از چندبار باز شدن پنجره Open with...
        // (داخل constructor گذاشته شده تا روی همه RNها بدون تنظیمات خاص کار کند)
        this._openLock = {};
        this._openLockTimer = {};

        this.state = {
            percentCompleted: 0,
            modalVisiblePercent: false,
            showDownloadModal: false,
            modalVisible: false,
            checkUploadRenderButton: this.props.upload.toString(),
            key: this.props.keyNumber,
            dueDate: this.props.dueDate,
            downloadURL: null,
            fileName: null,
            fileExt: null,
            progressVisible: false,
            base64File: null,
            fileType: null,
            classEventId: this.props.classEventId,
            imagePath: null,
            description: '',
            done: this.props.done,
            type: this.props.type,
            checkbox: this.props.done,
            classEventDoneData: null,
            allowToUploadFile: true,
            fileUri: null,
            fileData: null,
            imgUri: null,
            modalVisibleGallery: false,
            mediaTypeChoosen: '',

            active:false,
            modalVisibleVoiceAlert: true,
            showRecording: false,
            checkGuid: false,
            fadeAnim: new Animated.Value(20),
            check: 20,
            checkDownloadRenderButton: this.props.attachments && this.props.attachments.length,
            imageUri: null,
            audioCheckPath: null,
            recordSecs: 0,
            recordTime: '00:00:00',
            audioData: null,
            audioUri: null,
            fileNameAudio: '',
            isRecording: false,
            second: 0,
            minute: 0,
            ffsize: 0,
            audio: null,
            checkAudioIsPlayed: false,
            downloadComplete: false,
            loading: false,
            selectedFiles: [], // آرایه برای نگهداری فایل‌های انتخاب شده
        };
        this.onUrlPress = this.onUrlPress.bind(this);
        this.onPhonePress = this.onPhonePress.bind(this);
        this.onEmailPress = this.onEmailPress.bind(this);
    }

    _isLocked(key) {
        return this._openLock[key] === true;
    }

    _lock(key, ms = 2000) {
        this._openLock[key] = true;
        if (this._openLockTimer[key]) clearTimeout(this._openLockTimer[key]);
        this._openLockTimer[key] = setTimeout(() => {
            this._openLock[key] = false;
            this._openLockTimer[key] = null;
        }, ms);
    }

    // باز کردن فایل فقط یکبار (حل مشکل چندبار باز شدن Open with...)
    openFileOnce = (attachmentId, path) => {
        const key = `open_${attachmentId}`;
        if (this._isLocked(key)) return;
        this._lock(key, 4000);

        FileViewer.open(path, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
        }).catch(() => {});
    };

    componentWillMount(){
        this.getClassEventDoneInfo();
    }
    componentDidMount(){
        const options = {
            width: 720,
            endTime: 1280,
            bitrateMultiplier: 3,
            minimumBitrate: 300000,
        };
    }
    checkColor(){
        if(this.props.icon === 'check'){
            return '#51C29F';
        }
        else{
            return '#FC6468';
        }
    }

    // =========================
    // FIX: DocumentPicker + fileUri
    // =========================
    documentPickerFiles(){
        DocumentPicker.pick({
            allowMultiSelection: true,
            type: [DocumentPicker.types.allFiles],
            copyTo: 'cachesDirectory', // <-- اضافه شد
        })
            .then((responses) => {
                console.log('Selected files:', responses);

                responses.forEach((response) => {
                    const pickedUri = response.fileCopyUri || response.uri; // <-- مهم

                    if (response.type && response.type.split("/")[0] === "image") {
                        ImageResizer.createResizedImage(response.uri, 1200, 1200, 'JPEG', 60, 0)
                            .then((response2) => {
                                this.setState({
                                    selectedFiles: [...this.state.selectedFiles, {
                                        imgUri: response2.uri,
                                        imagePath: response2.path,
                                        base64File: response2.path,
                                        fileType: response.type,
                                        fileName: response2.name,
                                        fileData: response,
                                        fileUri: pickedUri,
                                        originalData: response,
                                    }],
                                    imgUri: response2.uri,
                                    imagePath: response2.path,
                                    base64File: response2.path,
                                    fileType: response.type,
                                    fileName: this.state.selectedFiles.length > 0 ?
                                        `${this.state.selectedFiles.length + 1} فایل انتخاب شده` :
                                        response2.name,
                                    fileData: response,
                                    fileUri: pickedUri,
                                });
                            })
                            .catch((err) => {
                                console.error('Image resize error:', err);
                            });
                    } else {
                        if (response.size < 200000000 || response.size === 200000000) {
                            this.setState({
                                selectedFiles: [...this.state.selectedFiles, {
                                    fileName: response.name,
                                    fileType: response.type,
                                    imagePath: response.uri,
                                    fileUri: pickedUri,
                                    originalData: response
                                }],
                                fileName: response.name,
                                fileType: response.type,
                                imagePath: response.uri,
                                fileUri: pickedUri,
                                fileData: response,
                            });
                        } else {
                            Alert.alert('', `حجم فایل ${response.name} نمی تواند بیشتر از 200 مگابایت باشد`);
                        }
                    }
                });
            })
            .catch ((err) => {
                if (DocumentPicker.isCancel(err)) {
                    console.log('User canceled the picker');
                } else {
                    console.error('DocumentPicker Error: ', err);
                }
            })
    }

    mediaPicker() {
        let options = null;
        if(this.state.mediaTypeChoosen === 'video') {
            options = {
                // title: 'Select media',
                takePhotoButtonTitle: 'take video',
                title: 'Select video',
                mediaType: 'video',
                videoQuality: 'low',
                quality: 0.5,
                path:'video',
                storageOptions: {
                    skipBackup: true,
                },
            };
        }
        else {
            options = {
                mediaType: 'photo',
                quality: 1,
                storageOptions: {
                    skipBackup: true,
                },
            };
        }
        ImagePicker2.showImagePicker(options, (image) => {
            if(!image.didCancel) {
                if (this.state.mediaTypeChoosen === 'photo') {
                    ImageResizer.createResizedImage(image.path, 1200, 1200, 'JPEG', 60, 0).then((response) => {
                        this.setState({
                            modalVisibleGallery: false,
                            imgUri: response.uri,
                            imagePath: response.path,
                            base64File: response.path,
                            fileType: image.type,
                            fileName: response.name,
                        });
                    }).catch((err) => {
                    });
                } else {
                    const fileName = image.path.split('/').pop();
                    const type = 'video/' + fileName.split('.').pop();
                    RNFetchBlob.fs.stat(image.path)
                        .then((stats) => {
                            if (stats.size < 200000000 || stats.size === 200000000) {
                                this.setState({
                                    modalVisibleGallery: false,
                                    imgUri: image.uri,
                                    imagePath: image.path,
                                    base64File: image.path,
                                    fileType: type,
                                    fileName: fileName,
                                });
                            } else {
                                Alert.alert('', 'حجم ویدئو نمی تواند بیشتر از 200 مگابایت باشد');
                            }
                        })
                        .catch((err) => {
                        });
                }
            }
        });
    }

    getMessageType(fileName){
        let fileFormat = fileName.split('.')[fileName.split('.').length - 1].toLowerCase();
        const audioTypes = ['mp3', 'mp4', 'ogg', 'wma', 'wav', 'raw', '3gp', 'aa', 'aac', 'aax', 'act', 'aiff', 'alac', 'amr', 'ape', 'au', 'awb', 'dct', 'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'm4p', 'mmf', 'mpc', 'msv', 'nmf', 'nsf', 'oga', 'mogg', 'opus', 'ra', 'rm', 'rf64', 'sln', 'tta', 'voc', 'vox', 'wma', 'wv', 'webm', '8svx', 'cda'];

        if(fileFormat === 'dll' || fileFormat === 'exe' || fileFormat === 'apk' || fileFormat === 'js'){
            this.setState({allowToUploadFile: false});
            Alert.alert(
                '',
                'فایل هایی با فرمت exe و dll و apk و js اجازه بارگذاری ندارند',
                [
                    {text: 'بسیار خب'},
                ],);
        }
        else if(this.state.fileType && this.state.fileType.includes('video') && fileFormat === 'mp4') {
            this.setState({allowToUploadFile: true});
            return(2);
        }
        else if(audioTypes.includes(fileFormat)){
            this.setState({allowToUploadFile: true});
            return(3);
        } else if(fileFormat === 'jpg' || fileFormat === 'bitmap' || fileFormat === 'png' || fileFormat === 'jpeg' || fileFormat === 'JPEG'){
            this.setState({allowToUploadFile: true});
            return(1);
        } else if(fileFormat === 'mpeg' || fileFormat === 'mp4' || fileFormat === '3gp' || fileFormat === '3gpp' || fileFormat === 'mpeg4' || fileFormat === 'mpeg3' || fileFormat === 'm4a'){
            this.setState({allowToUploadFile: true});
            return(2);
        } else if(fileFormat === 'pdf' || fileFormat === 'doc' || fileFormat === 'docx' || fileFormat === 'xls' || fileFormat === 'xlsx' || fileFormat === 'rar' || fileFormat === 'zip' || fileFormat === 'xz' || fileFormat === 'docx' || fileFormat === 'rar' || fileFormat === 'zip' || fileFormat === 'xz'){
            this.setState({allowToUploadFile: true});
            return(4);
        }
    }

    async beforeUploadFile(){
        this.setState({percentCompleted: 0});

        if(this.state.selectedFiles.length === 0) {
            Alert.alert('', 'انتخاب حداقل یک فایل برای این تکلیف اجباری است.',   [
                {text: 'بسیار خب'},
            ]);
        }
        else {
            this.fileSend();
        }
    }

    async fileSend() {
        if(this.state.allowToUploadFile && this.state.selectedFiles.length > 0) {
            await this.setState({modalVisiblePercent: true}, async () => {
                try {
                    const doneResponse = await Axios.post('http://api.modabberonline.com/api/pri/v1/classEventDones.done', {
                        ClassEventId: this.state.classEventId,
                        Description:  this.state.description,
                        AttachmentFile: {
                            name: null,
                            contentType: null,
                            content: null,
                        },
                    }, {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    console.log(', doneResponse', doneResponse)
                    if (doneResponse.status.toString() === '200') {
                        const classEventDoneId = doneResponse.data?.classEventDoneId;

                        for (let i = 0; i < this.state.selectedFiles.length; i++) {
                            const file = this.state.selectedFiles[i];
                            let formData = new FormData();
                            let pName = file.fileName;
                            let typeFile = file.fileType;

                            var p = /[پچجحخهعغفقثصضشسیبلاتنمکگوئدذرزطظژؤإأءًٌٍَُِّ\s]+$/;
                            pName = pName.replace(/[()]/g, '');
                            if(p.test(pName?.split('.')[0])) {
                                // FIX 2: جلوگیری از ساخت پسوند msword (باید doc شود)
                                let ext = typeFile?.split('/')[1];
                                if (typeFile === 'application/msword') ext = 'doc';
                                else if (typeFile === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = 'docx';
                                else if (typeFile === 'application/vnd.ms-excel') ext = 'xls';
                                else if (typeFile === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ext = 'xlsx';
                                else if (typeFile === 'application/vnd.ms-powerpoint') ext = 'ppt';
                                else if (typeFile === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') ext = 'pptx';
                                else if (typeFile === 'application/pdf') ext = 'pdf';
                                if (!ext) ext = 'bin';

                                pName = 'file_' + Math.floor(Math.random() * 1000 + 2) + '.' + ext;
                            }

                            const audioTypes = ['mp3', 'mp4', 'ogg', 'wma', 'wav', 'raw', '3gp', 'aa', 'aac', 'aax', 'act', 'aiff', 'alac', 'amr', 'ape', 'au', 'awb', 'dct', 'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'm4p', 'mmf', 'mpc', 'msv', 'nmf', 'nsf', 'oga', 'mogg', 'opus', 'ra', 'rm', 'rf64', 'sln', 'tta', 'voc', 'vox', 'wma', 'wv', 'webm', '8svx', 'cda'];

                            if(pName?.indexOf('.') === -1 ) {
                                if(typeFile.split('/')[0] === 'audio') {
                                    pName = pName + '.' + 'mp3';
                                }
                            }
                            else if(typeFile?.split('/')[0] === 'audio' && !audioTypes.includes(pName.split('.').pop())) {
                                pName = pName + '.mp3';
                            }

                            let fileUri;
                            if (typeFile?.includes('audio') && file.audioUri) {
                                fileUri = file.audioUri.startsWith('file://') ? file.audioUri : 'file://' + file.audioUri;
                            } else {
                                fileUri = file.imagePath || file.imgUri || file.fileUri;
                            }
                            fileUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`
                            if (fileUri.startsWith('file://content://')) {
                                fileUri = fileUri.replace('file://', '');
                            }

                            formData.append('file', {
                                uri: fileUri,
                                type: typeFile,
                                name: pName,
                            });
                            console.log('aaapppppend', {
                                uri: fileUri,
                                type: typeFile,
                                name: pName,
                            });

                            const rttesponse =  await Axios.post(
                                'http://api.modabberonline.com/api/pri/v1/classEventDones.uploadAttachmentFileV2?classEventDoneId=' + classEventDoneId,
                                formData,
                                {
                                    onUploadProgress: (progressEvent) => {
                                        var percentCompleted = Math.round(((i / this.state.selectedFiles.length) + (progressEvent.loaded / progressEvent.total / this.state.selectedFiles.length)) * 100);
                                        this.setState({percentCompleted: percentCompleted});
                                    },
                                    headers: {
                                        Accept: 'application/json',
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'multipart/form-data',
                                    },
                                }
                            );
                            console.log('doneResponse2', rttesponse)

                        }
                        this.getClassEventDoneInfo();
                        this.setState({
                            modalVisiblePercent: false,
                            selectedFiles: []
                        });
                        Alert.alert('', 'بارگذاری همه فایل‌ها با موفقیت انجام شد', [
                            {text: 'بسیار خب'},
                        ]);
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    Alert.alert('','خطا در ارتباط با سرور !');
                    this.setState({modalVisiblePercent: false});

                    Axios.post('http://api.modabberonline.com/api/pri/v1/classEventDones.undone', {
                        ClassEventId: this.state.classEventId,
                    },{
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }).catch(() => {});
                }
            });
        } else {
            if (this.state.selectedFiles.length === 0) {
                Alert.alert('', 'لطفاً حداقل یک فایل انتخاب کنید');
            } else {
                Alert.alert('', 'فایل هایی با فرمت exe و dll و apk و js اجازه بارگذاری ندارند');
            }
        }
    }

    async requestStoragePermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    'title': 'درخواست اچازه دسترسی به حافظه گوشی',
                    'message': 'برای دانلود فایل ما باید اجازه دسترسی به حافظه گوشی را داشته باشیم تا بتوانیم فایل ها را پس از دانلود در حافظه ذخیره کنیم',
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            } else {
            }
        } catch (err) {
        }

    }

    getClassEventDoneInfo(){
        fetch('http://api.modabberonline.com/api/pri/v1/classEventDones.info', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ClassEventId: this.state.classEventId,
            }),
        }).then(async (response) => {
            this.statusCode = response.status.toString();
            return response.json();
        })
            .then(responseJson => {
                if(this.statusCode === '200'){
                    this.setState({classEventDoneData: responseJson, fileName: null});
                } else if(this.statusCode === '204'){
                } else {
                    Alert.alert(
                        '',
                        ' خطا در ارتباط با سرور !',
                    );
                }
            })
            .then(()=>this.setState({progressVisible:false}));
    }

    attemptToDownload(){
        this.setState({showDownloadModal: true});
    }

    beforeDelete(id) {
        Alert.alert(
            '',
            'آیا میخواهید فایل خودرا حذف نمائید؟',
            [
                {text: 'خیر'},
                {text: 'بله', onPress: async ()=>this.deleteUploadedFile(id)},
            ]
        );
    }

    downloadFile(attachmentId, show, originalFileName) {
        // جلوگیری از دانلودِ دوباره پشت سر هم
        const lockKey = `dl_${attachmentId}_${show ? 'open' : 'dl'}`;
        if (this._isLocked(lockKey)) return;
        this._lock(lockKey, 2500);

        if (!show) {
            ToastAndroid.show('در حال دانلود فایل...', 2000);
        }

        let urlItem = '';
        if(show) {
            urlItem = 'http://api.modabberonline.com/api/pri/v1/classEventDones.getFileUrl';
        }
        else {
            urlItem = 'http://api.modabberonline.com/api/pri/v1/classEventsAttachments.getFileUrl';
        }

        fetch(urlItem, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: attachmentId.toString(),
        }).then((response) => response.json())
            .then((responseJson) => {
                if (responseJson === 'NotAvailableAtTheMoment') {
                    Alert.alert('',
                        'فایل مورد نظر یافت نشد',
                        [
                            {text: 'بسیار خب'},
                        ],
                    );
                }
                else {
                    let url = responseJson.fileDownloadUrl;
                    let fileName = originalFileName || url.split('/').pop();
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}

                    // اسم امن (برای فارسی) + پسوند درست (doc/docx…)
                    const safeName = this.getSafeLocalFileName(fileName, responseJson.mimeType);

                    let options = {
                        fileCache: true,
                        addAndroidDownloads: {
                            useDownloadManager: true,
                            notification: true,
                            title: fileName,
                            path: RNFetchBlob.fs.dirs.DownloadDir + `/${safeName}`,
                            description: 'Downloading file',
                        },
                    };

                    // اگر show=true برای باز کردن، توی Cache دانلود کن تا مشکلات دسترسی کمتر شه
                    if (show) {
                        options = {
                            fileCache: true,
                            path: `${RNFetchBlob.fs.dirs.CacheDir}/${safeName}`,
                        };
                    }

                    try {
                        RNFetchBlob.config(options)
                            .fetch('GET', url)
                            .then((res) => {
                                const realPath = (res && res.path) ? (res.path() || (show ? `${RNFetchBlob.fs.dirs.CacheDir}/${safeName}` : RNFetchBlob.fs.dirs.DownloadDir + `/${safeName}`)) : (show ? `${RNFetchBlob.fs.dirs.CacheDir}/${safeName}` : RNFetchBlob.fs.dirs.DownloadDir + `/${safeName}`);

                                let temp = false;
                                AsyncStorage.getItem('fileAttach').then((info) => {
                                    if (info !== null) {
                                        let newInfo = JSON.parse(info);
                                        newInfo.map((item, index) => {
                                            if (item.url !== url) {
                                                temp = true;
                                            }
                                        });
                                        if (temp) {
                                            newInfo.push({
                                                url: url,
                                                path: realPath,
                                                mimeType: responseJson.mimeType,
                                            });
                                        }
                                        AsyncStorage.setItem('fileAttach', JSON.stringify(newInfo));
                                    } else {
                                        let uurls = [];
                                        uurls.push({
                                            url: url,
                                            path: realPath,
                                            mimeType: responseJson.mimeType,
                                        });
                                        AsyncStorage.setItem('fileAttach', JSON.stringify(uurls));
                                    }
                                });

                                // فقط یکبار باز کن (بدون mimeType تا خطای No app associated کم شود)
                                if(!show) {
                                    Alert.alert(
                                        '',
                                        'دانلود به پایان رسید',
                                        [
                                            {
                                            text: 'باز کردن فایل', onPress: () => this.openFileOnce(attachmentId, realPath),
                                            },
                                            {text: 'باشه'},
                                        ],
                                    );
                                }
                                else if (show) {
                                this.openFileOnce(attachmentId, realPath);
                                }
                            })
                            .catch((err) => {
                                Alert.alert('', 'فایل مورد نظر یافت نشد');
                            });
                    } catch (err) {
                        Alert.alert('', 'فایل مورد نظر یافت نشد');
                    }
                }

            })
            .then(()=>this.setState({progressVisible:false}))
            .catch((error) => {
                this.setState({progressVisible:false});
                Alert.alert(
                    '',
                    'خطا در ارتباط با سرور !',
                );
            });
    }

    beforeDownloadFile(attachmentId, show, originalFileName) {
        let flag = false;
        let pt = '';
        let mt = '';
        let urlItem = '';
        try{
            if(show) {
                urlItem = 'http://api.modabberonline.com/api/pri/v1/classEventDones.getFileUrl';
            }
            else {
                urlItem = 'http://api.modabberonline.com/api/pri/v1/classEventsAttachments.getFileUrl';
            }
            fetch(urlItem, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: attachmentId.toString(),
            })
                .then(response => {
                    if(response.status === 200){
                        return response.json();
                    }
                    else if(response.status === 204){
                        Alert.alert(
                            '',
                            'فایل مورد نظر یافت نشد',
                            [
                                {text: 'بسیار خب', onPress: ()=> {return null;}},
                            ]
                        );
                    }
                })
                .then((responseJson) => {
                    if(responseJson) {
                        let url = responseJson.fileDownloadUrl;
                        AsyncStorage.getItem('fileAttach').then(async (info) => {
                            if (info !== null) {
                                let newInfo = JSON.parse(info);
                                if(newInfo.length > 0) {
                                    await newInfo.map((item, index)=> {
                                        if(item.url.toString() === url) {
                                            flag = true;
                                            pt = item.path;
                                            mt = item.mimeType;
                                        }
                                    });
                                    if(flag) {
                                        await RNFS.exists(pt)
                                            .then((result) => {
                                                if(result) {
                                                    // فقط یکبار باز کن
                                                    this.openFileOnce(attachmentId, pt);
                                                }
                                                else {
                                                    this.downloadFile(attachmentId, show, originalFileName);
                                                }
                                            })
                                            .catch((err) => {
                                                this.downloadFile(attachmentId, show, originalFileName);
                                            });
                                    }
                                    else {
                                        this.downloadFile(attachmentId, show, originalFileName);
                                    }
                                } else {
                                    this.downloadFile(attachmentId, show, originalFileName);
                                }
                            }
                            else {
                                this.downloadFile(attachmentId, show, originalFileName);
                            }
                        });
                    }

                })
                .then(()=>this.setState({progressVisible:false}))
                .catch((error) => {
                    this.setState({progressVisible:false});
                    Alert.alert(
                        '',
                        'خطا در ارتباط با سرور !',
                    );
                });
        }
        catch (e) {
        }
    }

    setModalVisible(visible) {
        this.setState({
            modalVisible: visible,
            fileName: null,
            imagePath: null,
            fileType: null,
            base64File: null,
        });
    }

    async onStartRecord() {
        let fileNameAudio = 'voice_' + Math.floor(Math.random() * 10000 + 2) + '.mp4';
        rec = new Recorder(fileNameAudio).record().prepare((err, fsPath)=>{
            this.setState({
                audioUri: fsPath,
                fileNameAudio: fileNameAudio,
                audio: new Player(fsPath, {autoDestroy: false}),
            });
        });
    }

    onFilePrepare() {
        if (this.state.audioUri && this.state.fileNameAudio) {
            this.setState({
                selectedFiles: [...this.state.selectedFiles, {
                    fileName: this.state.fileNameAudio,
                    imagePath: this.state.audioUri,
                    fileType: 'audio/mp4',
                    audioUri: this.state.audioUri,
                    audio: this.state.audio
                }],
                fileName: this.state.selectedFiles.length > 0 ?
                    `${this.state.selectedFiles.length + 1} فایل انتخاب شده` :
                    this.state.fileNameAudio,
                imagePath: this.state.audioUri,
                fileType: 'audio/mp4',
            });
        }
    }

    async onStopRecord() {
        if(rec !== null){
            try {
                await rec.stop(async (err) => {
                    if(this.state.second > 0){
                        await this.onFilePrepare();
                    }
                    else {
                        ToastAndroid.show('برای ضبط صدا دکمه را نگه دارید', 2000);
                    }
                    await this.setState({
                        showRecording: false,
                        second: 0,
                        minute: 0,
                    });

                });
            }
            catch (e) {
                this.setState({showRecording: false});
                rec = null;
            }
        }
        else {
            this.setState({showRecording: false});
        }
    }

    async requestRecordPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    'title': 'درخواست اچازه دسترسی برای ضبط صوت',
                    'message': 'برای ضبط صوت ما باید اجازه دسترسی به حافظه گوشی را داشته باشیم تا بتوانیم فایل ها را در حافظه ذخیره کنیم',
                }
            );
        } catch (err) {
        }
    }

    async startRecording() {
        this.setState({
            fileName: null,
            imagePath: null,
            fileType: null,
            base64File: null,
            audioUri: null,
            fileNameAudio: '',
            second: 0,
            minute: 0,
            showRecording: false,
        }, () => {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).then(async response => {
                if (response === true){
                    secondRef = await setInterval(()=> {
                        if(this.state.second === 59) {
                            this.setState({second: 0});
                        }
                        else {
                            this.setState({second: this.state.second + 1});
                        }
                    }, 1000);
                    minRef = await setInterval(()=> {
                        this.setState({minute: this.state.minute + 1});
                    }, 60000);
                    await this.setState({showRecording: true}, () => {this.onStartRecord();});
                }
                else if (response === false){
                    await this.requestRecordPermission();
                }
            });
        });

    }

    async endRecording() {
        await clearInterval(secondRef);
        await clearInterval(minRef);
        await this.setState({showRecording: false}, () => {this.onStopRecord();});
    }

    renderModalUploadButtons(){
        if(this.state.checkUploadRenderButton === 'true'){
            return(
                <View style={publicStyles.selectorsContainer}>
                    <TouchableWithoutFeedback  onPressIn={()=> {
                        if (this.props.item.isExpired && !this.props.item.studentCanUploadAttachmentAfterExpiration) {
                            Alert.alert(
                                '', 'موعد تحویل گذشته است و شما قادر به بارگذاری فایل برای این تکلیف نمی باشید.',
                                [{text: 'بسیار خب'}]);
                        }
                        else {
                            this.startRecording();
                        }
                    }}
                                               onPressOut={()=> {

                                                   if (this.props.item.isExpired && !this.props.item.studentCanUploadAttachmentAfterExpiration) {
                                                       Alert.alert(
                                                           '', 'موعد تحویل گذشته است و شما قادر به بارگذاری فایل برای این تکلیف نمی باشید.',
                                                           [{text: 'بسیار خب'}]);
                                                   }
                                                   else {
                                                       this.endRecording();
                                                   }
                                               }}
                                               style={publicStyles.fileSelectContainer}>
                        <View>
                            <View style={publicStyles.photoIconContainer}>
                                <MCIcon name="microphone" style={[publicStyles.photoIcon, {color: this.state.showRecording ? 'red' : '#E2E7ED'}]} />
                            </View>
                            <View style={publicStyles.galeryIconCotainer}>
                                <Text style={styles.textStyle}>ضبط صدا</Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableEffect
                        onPress={()=> {
                            if (this.props.item.isExpired && !this.props.item.studentCanUploadAttachmentAfterExpiration) {
                                Alert.alert(
                                    '', 'موعد تحویل گذشته است و شما قادر به بارگذاری فایل برای این تکلیف نمی باشید.',
                                    [{text: 'بسیار خب'}]);
                            }
                            else {
                                ImagePicker.openPicker({
                                    includeBase64: true,
                                    mediaType: 'photo',
                                    multiple: true, // چند انتخابی
                                }).then((images) => {
                                    if (!Array.isArray(images)) {
                                        images = [images];
                                    }

                                    images.forEach((image) => {
                                        ImageResizer.createResizedImage(image.path, 1200, 1200, 'JPEG', 60, 0)
                                            .then((response) => {
                                                this.setState({
                                                    selectedFiles: [...this.state.selectedFiles, {
                                                        imgUri: response.uri,
                                                        imagePath: response.path,
                                                        base64File: response.path,
                                                        fileType: image.mime,
                                                        fileName: response.name,
                                                    }],
                                                    imgUri: response.uri,
                                                    imagePath: response.path,
                                                    base64File: response.path,
                                                    fileType: image.mime,
                                                    fileName: this.state.selectedFiles.length > 0 ?
                                                        `${this.state.selectedFiles.length + 1} فایل انتخاب شده` :
                                                        response.name,
                                                });
                                            }).catch((err) => {
                                            console.error('Image resize error:', err);
                                        });
                                    });
                                });
                            }
                        }
                        } style={publicStyles.rightSpace}>
                        <View>
                            <View style={publicStyles.photoIconContainer}>
                                <MIcon style={publicStyles.photoIcon} name="photo-library" />
                            </View>
                            <View style={publicStyles.galeryIconCotainer}>
                                <Text style={styles.textStyle}>گالری</Text>
                            </View>
                        </View>
                    </TouchableEffect>
                    <TouchableEffect onPress={()=> {
                        if (this.props.item.isExpired && !this.props.item.studentCanUploadAttachmentAfterExpiration) {
                            Alert.alert(
                                '', 'موعد تحویل گذشته است و شما قادر به بارگذاری فایل برای این تکلیف نمی باشید',
                                [{text: 'بسیار خب'}]);
                        } else {
                            ImagePicker.openCamera({includeBase64: true, mediaType: 'photo'}).then((image) => {
                                ImageResizer.createResizedImage(image.path, 1200, 1200, 'JPEG', 60, 0).then((response) => {
                                    this.setState({
                                        selectedFiles: [...this.state.selectedFiles, {
                                            imgUri: response.uri,
                                            imagePath: response.path,
                                            base64File: response.path,
                                            fileType: image.mime,
                                            fileName: response.name,
                                        }],
                                        imgUri: response.uri,
                                        imagePath: response.path,
                                        base64File: response.path,
                                        fileType: image.mime,
                                        fileName: this.state.selectedFiles.length > 0 ?
                                            `${this.state.selectedFiles.length + 1} فایل انتخاب شده` :
                                            response.name,
                                    });
                                }).catch((err) => {
                                    console.error('Image resize error:', err);
                                });
                            });
                        }
                    }
                    } style={publicStyles.cameraContainer}>
                        <View>
                            <View style={publicStyles.photoIconContainer}>
                                <SIcon style={publicStyles.photoIcon} name="camera"  />
                            </View>
                            <View style={publicStyles.galeryIconCotainer}>
                                <Text style={styles.textStyle}>دوربین</Text>
                            </View>
                        </View>
                    </TouchableEffect>
                    <TouchableEffect onPress={
                        async ()=> {
                            if (this.props.item.isExpired && !this.props.item.studentCanUploadAttachmentAfterExpiration) {
                                Alert.alert(
                                    '', 'موعد تحویل گذشته است و شما قادر به بارگذاری فایل برای این تکلیف نمی باشید',
                                    [{text: 'بسیار خب'}]);
                            } else {
                                await this.documentPickerFiles();
                            }
                        }
                    }  style={publicStyles.fileSelectContainer}>
                        <View>
                            <View style={publicStyles.photoIconContainer}>
                                <LocalIcon style={publicStyles.photoIcon} name="icon_doc_attach" />
                            </View>
                            <View style={publicStyles.galeryIconCotainer}>
                                <Text style={styles.textStyle}>انتخاب فایل</Text>
                            </View>
                        </View>
                    </TouchableEffect>
                </View>
            );
        }else{
            return null;
        }
    }

    renderUploadedFiles(){
        if(this.state.classEventDoneData !== null){
            return(
                <View style={publicStyles.uploadContainer}>
                    {
                        this.state.classEventDoneData.attachments.map((item, key) => {
                            let audioType = false;
                            let fileFormat = item.filename.split('.')[item.filename.split('.').length - 1].toLowerCase();
                            const audioTypes = ['mp3', 'mp4', 'ogg', 'wma', 'wav', 'raw', '3gp', 'aa', 'aac', 'aax', 'act', 'aiff', 'alac', 'amr', 'ape', 'au', 'awb', 'dct', 'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'm4p', 'mmf', 'mpc', 'msv', 'nmf', 'nsf', 'oga', 'mogg', 'opus', 'ra', 'rm', 'rf64', 'sln', 'tta', 'voc', 'vox', 'wma', 'wv', 'webm', '8svx', 'cda'];

                            if(audioTypes.includes(fileFormat)){
                                audioType = true;
                            }

                            return (
                                <View key={key} style={publicStyles.rowContainerFile}>
                                    <TouchableOpacity style={publicStyles.leftRow}>
                                        <Text style={stylesPage.blackColor}>{item.filename}</Text>
                                    </TouchableOpacity>

                                    <View style={stylesPage.rightRow}>
                                        {
                                            audioType ?
                                                <VoicePlayerPart item={item} haveTeacherAttach uploadedAttach />
                                                :
                                                <TouchableOpacity
                                                    onPress={async () => {
                                                        Platform.OS !== 'ios' ? await this.requestStoragePermission() : null;
                                                        this.beforeDownloadFile(item.attachmentId, true, item.filename);
                                                    }}>
                                                    <Image source={attachDn} style={publicStyles.attachDnIcon} />
                                                </TouchableOpacity>
                                        }

                                        <FIcon name="trash" style={[publicStyles.redColor, publicStyles.font20]}
                                               onPress={() => this.beforeDelete(item.attachmentId)}/>
                                    </View>
                                </View>
                            );
                        })
                    }
                </View>
            );
        }
    }

    deleteUploadedFile(ClassEventDoneAttachmentId){
        fetch('http://api.modabberonline.com/api/pri/v1/classEventDones.deleteAttachment', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ClassEventDoneAttachmentId: ClassEventDoneAttachmentId,
            }),
        }).then(async (response) => {
            if(response.status.toString() === '200'){
                this.getClassEventDoneInfo();
            }
        })
            .then(()=>this.setState({progressVisible:false}))
            .catch((error) => {
                this.setState({progressVisible:false});
                Alert.alert(
                    '',
                    'خطا در ارتباط با سرور !',
                );
            });
    }

    renderDownloadButton(){
        if(this.state.checkDownloadRenderButton !== 0){
            return(
                <View style={stylesPage.downloadContainer}>
                    <TouchableOpacity onPress={async ()=>{Platform.OS !== 'ios' ? await this.requestStoragePermission() : null; this.attemptToDownload();}} style={stylesPage.downloadBtn}>
                        <Text style={stylesPage.downloadText}>دریافت ضمایم</Text>
                        <LocalIcon style={stylesPage.iconAttach} name="icon_attach"/>
                    </TouchableOpacity>
                </View>
            );
        }
        else {
            return null;
        }
    }

    renderIcon(){
        if(this.state.checkAudioIsPlayed === false){
            return(<ENIcon name={'controller-play'} style={{fontSize: 15, color: '#FFF'}} />);
        } else {
            return(<ENIcon name={'controller-paus'} style={{fontSize: 15, color: '#FFF'}} />);
        }
    }

    renderRecordIcon() {
        return <RIcon name="controller-record" style={styles.recordIcon} />;
    }

    renderDownloadableItems(){
        return(
            this.props.attachments && this.props.attachments.map((item, key) => {
                let audioType = false;
                let fileFormat = item.filename.split('.')[item.filename.split('.').length - 1].toLowerCase();
                const audioTypes = ['mp3', 'mp4', 'ogg', 'wma', 'wav', 'raw', '3gp', 'aa', 'aac', 'aax', 'act', 'aiff', 'alac', 'amr', 'ape', 'au', 'awb', 'dct', 'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'm4p', 'mmf', 'mpc', 'msv', 'nmf', 'nsf', 'oga', 'mogg', 'opus', 'ra', 'rm', 'rf64', 'sln', 'tta', 'voc', 'vox', 'wma', 'wv', 'webm', '8svx', 'cda'];
                if(audioTypes.includes(fileFormat)){
                    audioType = true;
                }
                return(
                    <TouchableOpacity key={key} onPress={() => this.beforeDownloadFile(item.attachmentId, false, item.filename)} style={stylesPage.attachBtn}>
                        {
                            audioType ?
                                <VoicePlayerPart item={item} haveTeacherAttach />
                                : null
                        }
                        <View>
                            <Text>{`دریافت ضمیمه ${key + 1}`}</Text>
                        </View>
                        <View>
                            <LocalIcon style={stylesPage.attachIconLocal} name="icon_attach" />
                        </View>
                    </TouchableOpacity>
                );
            })
        );
    }

    onUrlPress(url) {
        if (WWW_URL_PATTERN.test(url)) {
            Linking.openURL(`http://${url}`);
        } else {
            Linking.openURL(url);
        }
    }

    onPhonePress(phone) {
        const options = ['Call', 'Text', 'Cancel'];
        const cancelButtonIndex = options.length - 1;
        this.context.actionSheet().showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
            },
            (buttonIndex) => {
                switch (buttonIndex) {
                    case 0:
                        Communications.phonecall(phone, true);
                        break;
                    case 1:
                        Communications.text(phone);
                        break;
                    default:
                        break;
                }
            },
        );
    }

    onEmailPress(email) {
        Communications.email([email], null, null, null, null);
    }

    // حذف یک فایل از لیست فایل‌های انتخاب شده
    removeSelectedFile(index) {
        const newFiles = [...this.state.selectedFiles];
        newFiles.splice(index, 1);
        this.setState({ selectedFiles: newFiles });
    }

    // =========================
    // FIX: safe copy for content://
    // =========================
    copyContentUriToPath = async (contentUri, targetPath) => {
        const chunkSize = 1024 * 1024; // 1MB
        const inStream = await RNFetchBlob.fs.readStream(contentUri, 'base64', chunkSize);
        const outStream = await RNFetchBlob.fs.writeStream(targetPath, 'base64', false);

        await new Promise((resolve, reject) => {
            inStream.open();

            inStream.onData((chunk) => {
                outStream.write(chunk);
            });

            inStream.onError((err) => {
                try { outStream.close(); } catch (e) {}
                reject(err);
            });

            inStream.onEnd(() => {
                outStream.close();
                resolve();
            });
        });
    };

    getCorrectMimeType = (filename) => {
        const name = (filename || '').split('?')[0].split('#')[0];
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

        const mimeTypes = {
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
            mp4: 'video/mp4',
            txt: 'text/plain',
            zip: 'application/zip',
            rar: 'application/vnd.rar',
            xz: 'application/x-xz',
        };

        return mimeTypes[ext] || null;
    };

    getSafeLocalFileName = (originalName, mimeType) => {
        const clean = (originalName || '').split('?')[0].split('#')[0];
        const extFromName = clean.includes('.') ? clean.split('.').pop().toLowerCase() : '';

        const mimeToExt = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.ms-word': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'application/zip': 'zip',
            'application/x-xz': 'xz',
            'application/vnd.rar': 'rar',
        };

        const ext = extFromName || mimeToExt[mimeType] || 'bin';

        const isAscii = /^[\x00-\x7F]+$/.test(clean);
        if (!isAscii) return `file_${Date.now()}.${ext}`;

        const safe = clean.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_');
        if (!safe.includes('.') && ext) return `${safe}.${ext}`;
        return safe;
    };

    openFileSelected = async (file) => {
        try {
            const fileName = file.fileName || file.name || file?.originalData?.name || `file_${Date.now()}`;

            let sourceUri =
                file.fileUri ||
                file.imagePath ||
                file.imgUri ||
                file.uri ||
                file?.originalData?.fileCopyUri ||
                file?.originalData?.uri;

            if (!sourceUri || typeof sourceUri !== 'string') {
                throw new Error('Invalid sourceUri');
            }

            if (sourceUri.startsWith('file://content://')) {
                sourceUri = sourceUri.replace('file://', '');
            }

            const cacheDir =
                Platform.OS === 'android'
                    ? RNFS.ExternalCachesDirectoryPath
                    : RNFS.CachesDirectoryPath;

            await RNFS.mkdir(cacheDir);

            const cleanName = (fileName || '').split('?')[0].split('#')[0];
            const ext =
                cleanName.includes('.') && cleanName.split('.').pop() && !cleanName.split('.').pop().includes('/')
                    ? cleanName.split('.').pop()
                    : '';

            const isAscii = /^[\x00-\x7F]+$/.test(cleanName);

            const baseName = isAscii
                ? cleanName
                : `file_${Date.now()}${ext ? '.' + ext : ''}`;
            const safeBase = baseName.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_');
            const safeName = `${Date.now()}_${safeBase}`;

            const targetPath = `${cacheDir}/${safeName}`;

            const exists = await RNFS.exists(targetPath);
            if (exists) {
                await RNFS.unlink(targetPath);
            }

            if (Platform.OS === 'android' && sourceUri.startsWith('content://')) {
                await this.copyContentUriToPath(sourceUri, targetPath);
                await FileViewer.open(targetPath, {
                    showOpenWithDialog: true,
                    showAppsSuggestions: true,
                });
                return;
            }

            const normalizedSource = sourceUri.startsWith('file://')
                ? sourceUri.replace('file://', '')
                : sourceUri;

            await RNFS.copyFile(normalizedSource, targetPath);

            await FileViewer.open(targetPath, {
                showOpenWithDialog: true,
                showAppsSuggestions: true,
            });

        } catch (err) {
            console.log('OPEN FILE ERROR:', err);
            Alert.alert('خطا', 'امکان باز کردن فایل وجود ندارد');
        }
    };

    renderIconAudio(file){
        if(file.checkAudioIsPlayed === false || !file.checkAudioIsPlayed){
            return(<ENIcon name={'controller-play'} style={{fontSize: 15, color: '#FFF'}} />);
        } else {
            return(<ENIcon name={'controller-paus'} style={{fontSize: 15, color: '#FFF'}} />);
        }
    }

    // نمایش لیست فایل‌های انتخاب شده
    renderSelectedFiles() {
        if (this.state.selectedFiles.length === 0) {
            return null;
        }

        return (
            <View style={publicStyles.mrTopName}>
                {this.state.selectedFiles.map((file, index) => (
                    <View key={index} style={publicStyles.rowContainerFile}>
                        <TouchableOpacity onPress={() => this.openFileSelected(file)} style={[publicStyles.leftRow, {paddingBottom: 5}]}>
                            <Text style={publicStyles.roboto}>{file.fileName}</Text>
                        </TouchableOpacity>
                        <View style={[publicStyles.rightRow, {paddingBottom: 7}]}>
                            {
                                file.fileType && file.fileType.includes('audio') && file.audio ?
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newFiles = [...this.state.selectedFiles];
                                            const currentFile = newFiles[index];

                                            if (currentFile.checkAudioIsPlayed) {
                                                currentFile.audio.pause(() => {
                                                    currentFile.checkAudioIsPlayed = false;
                                                    this.setState({ selectedFiles: newFiles });
                                                });
                                            } else {
                                                currentFile.audio.play(() => {
                                                    currentFile.checkAudioIsPlayed = true;
                                                    this.setState({ selectedFiles: newFiles });

                                                    setTimeout(() => {
                                                        currentFile.audio.pause(() => {
                                                            currentFile.checkAudioIsPlayed = false;
                                                            this.setState({ selectedFiles: newFiles });
                                                        });
                                                    }, currentFile.audio.duration);
                                                });
                                            }
                                        }}>
                                        <View style={stylesPage.playerContainer}>
                                            {this.renderIconAudio(file)}
                                        </View>
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => this.openFileSelected(file)}>
                                        <Image source={attachDn} style={publicStyles.attachDnIcon} />
                                    </TouchableOpacity>
                            }
                            <IIcon name="close" style={[publicStyles.redColor, publicStyles.font20]}
                                   onPress={() => this.removeSelectedFile(index)} />
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    render() {
        return (
            <View>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.modalVisiblePercent}
                    onRequestClose={() => {
                    }}>
                    <View style={publicStyles.mediaChoose}>
                        <View style={publicStyles.mediaChooseBoxes}>
                            <Text style={publicStyles.loadingTxt}>در حال بارگذاری اطلاعات</Text>
                            <ProgressBar width={200} height={15} color={'green'} progress={this.state.percentCompleted / 100} />
                            <Text style={publicStyles.percentText}>
                                {this.state.percentCompleted} %
                            </Text>
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.modalVisibleGallery}
                    onRequestClose={() => {
                        this.setState({modalVisibleGallery: false});

                    }}>
                    <View style={publicStyles.mediaChoose}>
                        <View style={publicStyles.mediaChooseBox}>
                            <Text style={publicStyles.mediaChooseText}>انتخاب رسانه</Text>
                            <Text onPress={()=> {this.setState({mediaTypeChoosen: 'video'}, ()=> {this.mediaPicker();});}} style={publicStyles.chooseTitles}>انتخاب یا گرفتن ویدئو</Text>
                            <Text onPress={()=> {this.setState({mediaTypeChoosen: 'photo'}, ()=> {this.mediaPicker();});}} style={publicStyles.chooseTitles}>انتخاب یا گرفتن عکس</Text>
                        </View>
                        <TouchableOpacity onPress={()=> {this.setState({modalVisibleGallery: false});}} style={publicStyles.cancelTextContainer}>
                            <Text style={publicStyles.cancelText}>لعو</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.modalVisible}
                    onRequestClose={() => {
                        this.setModalVisible(false);
                        this.setState({
                            selectedFiles: [],
                        });
                    }}
                >
                    <View style={publicStyles.mediaChoose}>
                        <View style={stylesPage.hwArchiveContainer}>
                            <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={[mainColors.appColorDark, mainColors.appColorMedium, mainColors.appColorLight]}>
                                <View style={publicStyles.hwArchiveBox}>
                                    <View style={publicStyles.marginLeftStyle}>
                                        <IIcon name={'close'} style={[publicStyles.dirStyleIcon, {fontSize: normalize(25)}]} onPress={()=>this.setState({modalVisible:false, selectedFiles: []})} />
                                    </View>
                                    <View style={publicStyles.fileTextContainer}>
                                        <Text style={publicStyles.uploadTxt}>بارگذاری ضمایم تکلیف</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                                <View style={publicStyles.lessonContainer}>
                                    {
                                        this.props.item && this.props.item.isExpired ?
                                            <View style={stylesPage.expiredContainer}>
                                                <Text style={stylesPage.expText}>{this.props.item.studentCanUploadAttachmentAfterExpiration ?  'موعد تحويل تكليف به پايان رسيده است. تکلیف شما با برچسب تاخیر برای دبیر ارسال خواهد شد.' : 'موعد تحویل گذشته است.'} </Text>
                                                <FIcon name="info" style={{color: 'orange', fontSize: 20}} />
                                            </View>
                                            : null
                                    }
                                    <Text style={publicStyles.lessonText}>{`${this.props.lessonName} ${this.props.lessonName !== '' && this.props.title !== '' ? '-' : ''} ${this.props.title}`}</Text>
                                    <ParsedText
                                        style={publicStyles.lessonDescription}
                                        parse={[
                                            { type: 'url', style: stylesPage.linkStyle, onPress: this.onUrlPress },
                                            { type: 'phone', style: stylesPage.linkStyle,  onPress: this.onPhonePress },
                                            { type: 'email',style: stylesPage.linkStyle,  onPress: this.onEmailPress },
                                        ]}
                                        childrenProps={{ ...this.props.textProps }}
                                    >
                                        {this.props.description}
                                    </ParsedText>
                                </View>
                                {this.renderModalUploadButtons()}
                                {
                                    this.state.showRecording ?
                                        <View style={styles.recordIconContainer}>
                                            {this.renderRecordIcon()}
                                            <Text style={styles.secondsText}>{this.state.minute.toString().length === 1 ? '0' + this.state.minute : this.state.minute} : {this.state.second.toString().length === 1 ? '0' + this.state.second : this.state.second}</Text>
                                        </View>
                                        : null
                                }
                                {this.renderSelectedFiles()}
                                <View>
                                    {this.renderUploadedFiles()}
                                </View>
                            </ScrollView>
                            {
                                this.props.item.isExpired ?
                                    (this.props.item.studentCanUploadAttachmentAfterExpiration ?
                                        <View style={publicStyles.regBtnContainer}>
                                            <Button onPress={()=>this.beforeUploadFile()} style={stylesPage.regBtn}>
                                                <Text style={publicStyles.fontedText}>ثبت</Text>
                                            </Button>
                                        </View>
                                        : null)
                                    :
                                    <View style={publicStyles.regBtnContainer}>
                                        <Button onPress={()=>this.beforeUploadFile()} style={stylesPage.regBtn}>
                                            <Text style={publicStyles.fontedText}>ثبت</Text>
                                        </Button>
                                    </View>
                            }
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.showDownloadModal}
                    onRequestClose={() => {
                        this.setState({showDownloadModal: false});
                    }}>
                    <View style={publicStyles.mediaChoose}>
                        <View style={publicStyles.receive}>
                            <LinearGradient start={{x: 0, y:0}} end={{x: 1, y: 0}} colors={[mainColors.appColorDark, mainColors.appColorMedium, mainColors.appColorLight]}>
                                <View style={publicStyles.hwArchiveBox}>
                                    <View style={publicStyles.marginLeftStyle}>
                                        <IIcon style={publicStyles.closeIconUpload} onPress={() => {this.setState({showDownloadModal: false});}} name="close" />
                                    </View>
                                    <View style={publicStyles.fileTextContainer}>
                                        <Text style={publicStyles.uploadTxt}>دریافت ضمایم تکلیف</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true} style={{height: '50%'}}>
                                <View style={publicStyles.lessonContainer}>
                                    <Text style={publicStyles.lessonText}>{`${this.props.lessonName} ${this.props.lessonName !== '' && this.props.title !== '' ? '-' : ''} ${this.props.title}`}</Text>
                                </View>
                                {this.renderDownloadableItems()}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                <View style={[stylesPage.iconTypeContainer, {backgroundColor:this.props.backgroundColor}]}>
                    <View style={stylesPage.iconTypeBox}>
                        <View>
                            {
                                this.props.iconType === 'MaterialCommunityIcons' ?
                                    <MCIcon style={{color:this.checkColor(), fontSize: 25}} name={this.props.icon} />
                                    :
                                    <IIcon style={{color:this.checkColor(), fontSize: 25}} name={this.props.icon} />
                            }
                        </View>
                        <View>
                            <Text fontSize={'2xl'} style={publicStyles.lessonNameIcon}>{this.props.lessonName}</Text>
                        </View>
                    </View>
                    <View style={stylesPage.deliveryDateContainer}>
                        <View style={publicStyles.flexRowStyle}>
                            <View style={publicStyles.textSpace}>
                                <Text style={publicStyles.submitDateText}>{this.props.submitDate}</Text>
                            </View>
                            <View>
                                <Text style={publicStyles.submitDateText}>تاریخ انتشار</Text>
                            </View>
                        </View>
                        <View style={publicStyles.flexRowStyle}>
                            <View style={publicStyles.textSpace}>
                                <Text style={[stylesPage.fontSt, {color:this.checkColor()}]}>{this.props.deliveryDate}</Text>
                            </View>
                            <View>
                                <Text style={[stylesPage.fontSt, {color:this.checkColor()}]}>تاریخ تحویل</Text>
                            </View>
                        </View>
                    </View>
                    <View style={stylesPage.descriptionView}>
                        <ParsedText
                            style={stylesPage.descriptionTxtHw}
                            parse={[
                                { type: 'url', style: stylesPage.linkStyle, onPress: this.onUrlPress },
                                { type: 'phone', style: stylesPage.linkStyle,  onPress: this.onPhonePress },
                                { type: 'email',style: stylesPage.linkStyle,  onPress: this.onEmailPress },
                            ]}
                            childrenProps={{ ...this.props.textProps }}
                        >
                            {this.props.description}
                        </ParsedText>
                    </View>
                    <View style={publicStyles.uploadView}>
                        {
                            this.props.upload ?
                                <View style={stylesPage.downloadContainer}>
                                    <TouchableOpacity onPress={() => {this.setModalVisible(true);}} style={stylesPage.downloadBtn}>
                                        <Text style={stylesPage.loadingText}>بارگذاری</Text>
                                        <LocalIcon style={[publicStyles.iconUpload, {paddingLeft: 5}]} name="icon_upload_cloud" />
                                    </TouchableOpacity>
                                </View>
                                : null
                        }
                        <View>
                            <ProgressDialog
                                messageStyle={publicStyles.titleMessage}
                                contentStyle={publicStyles.loadMessage}
                                visible={this.state.progressVisible}
                                message="لطفاً کمی صبر کنید"
                            />
                        </View>
                        {this.renderDownloadButton()}
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    main:{
        flex:1,
    },
    buttonStyle: {
        backgroundColor:mainColors.appColorLight,
        width:200,
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:5,
    },
    textStyle: {
        color: mainColors.contentText,
        fontSize:16,
        textAlign:'right',
    },
    recordIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordIcon: {
        color: 'red',
        fontSize: 18,
        marginRight: 10,
    },
});

export {HomeworkArchiveItem};

