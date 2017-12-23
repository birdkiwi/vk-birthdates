import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import moment from 'moment';
import config from './config';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    accessToken: null,
    groupInfo: {},
    groupMembers: [],
    startDate: moment(),
    endDate: moment().add(7, 'days'),
    spinner: false
  },
  mutations: {
    setAccessToken(state, token) {
      state.accessToken = token;
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
    fetchGroupInfo(store, group_id) {
      return new Promise((resolve, reject) => {
        axios.get('fetchGroupInfo.php',
          {
            params: {
              group_id: group_id,
              fields: 'members_count',
              v: config.api_ver,
              access_token: store.state.token
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
              access_token: store.state.token
            }
          })
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  },
  getters: {
    countGroupMembersWithBirthday(state) {
      return state.groupMembers.filter(member => member.bdate).length;
    },
    countGroupMembersFiltered(state) {
      return state.groupMembers.filter(m => {
        if (m.bdate) {
          let bdate = m.bdate.split('.');

          //Check if in date range
          if (
            (moment(state.startDate).month() <= (bdate[1]-1)) &&
            ((bdate[1]-1) <= moment(state.endDate).month())
          ) {
            if (
              (moment(state.startDate).date() <= bdate[0]) &&
              (bdate[0] <= moment(state.endDate).date())
            ) {
              return true;
            }
          }
        }
      }).length;
    }
  },
  plugins: [createPersistedState({
    paths: ['accessToken']
  })]
});

export default store;
