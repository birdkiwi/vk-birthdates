import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import moment from 'moment';
import json2csv from 'json2csv';
import config from './config';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    userInfo: {
      user_id: null,
      access_token: null,
      personal: {}
    },
    groupInfo: {},
    groupMembers: [],
    startDate: moment().toDate(),
    endDate: moment().add(1, 'days').toDate(),
    spinner: false
  },
  mutations: {
    setUserId(state, id) {
      state.userInfo.user_id = id;
    },
    setAccessToken(state, token) {
      state.userInfo.access_token = token;
    },
    setUserPersonal(state, personal) {
      state.userInfo.personal = personal;
    },
    setGroupInfo(state, info) {
      state.groupInfo = info;
    },
    concatGroupMembers(state, members) {
      state.groupMembers = state.groupMembers.concat(members);
    },
    clearGroupMembers(state) {
      state.groupMembers = [];
    },
    setStartDate(state, date) {
      state.startDate = date;
    },
    setEndDate(state, date) {
      state.endDate = date;
    },
    setSpinner(state, status) {
      state.spinner = status;
    }
  },
  actions: {
    fetchUserInfo(store) {
      return new Promise((resolve, reject) => {
        axios.get('fetchUserInfo.php', {
          params: {
            user_ids: store.state.userInfo.user_id,
            fields: 'photo_50',
            lang: 'ru',
            access_token: store.state.userInfo.access_token,
            v: config.api_ver
          }
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
      });
    },
    fetchGroupInfo(store, group_id) {
      return new Promise((resolve, reject) => {
        axios.get('fetchGroupInfo.php',
          {
            params: {
              group_id: group_id,
              fields: 'members_count',
              v: config.api_ver,
              lang: 'ru',
              access_token: store.state.userInfo.access_token
            }
          })
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      });
    },
    fetchGroupMembers(store, params) {
      return new Promise((resolve, reject) => {
        axios.get('fetchGroupMembers.php',
          {
            params: {
              group_id: params.group_id,
              fields: 'bdate',
              count: 1000,
              offset: params.offset,
              v: config.api_ver,
              lang: 'ru',
              access_token: store.state.userInfo.access_token
            }
          })
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      });
    },
    getFilteredGroupMembersCSV(store) {
      const fields = ['id', 'first_name', 'last_name', 'bdate'];

      return json2csv({
        data: store.getters.filteredGroupMembers,
        fields
      });
    }
  },
  getters: {
    filteredGroupMembers(state) {
      return state.groupMembers.filter(m => {
        let searchStart = moment( '2000-' + moment(state.startDate).format('MM-DD'));
        let searchEnd = moment( '2000-' + moment(state.endDate).format('MM-DD'));

        if (m.bdate) {
          let bdate = m.bdate.split('.');
          bdate[0] = bdate[0].padStart(2, '0');
          bdate[1] = bdate[1].padStart(2, '0');
          bdate[2] = 2000;
          let memberBirthdate = moment(bdate[2] + '-' + bdate[1] + '-' + bdate[0]);

          //Check if in date range
          if (searchStart.isAfter(searchEnd)) {
            if (memberBirthdate.isSameOrAfter(searchStart) || memberBirthdate.isSameOrBefore(searchEnd)) {
              return true;
            }
          } else {
            if (memberBirthdate.isSameOrAfter(searchStart) && memberBirthdate.isSameOrBefore(searchEnd)) {
              return true;
            }
          }
        }
      });
    },
    countGroupMembersWithBirthday(state) {
      return state.groupMembers.filter(member => member.bdate).length;
    },
    countGroupMembersFiltered(state, getters) {
      return getters.filteredGroupMembers.length;
    }
  },
  plugins: [createPersistedState({
    paths: ['userInfo']
  })]
});

export default store;
