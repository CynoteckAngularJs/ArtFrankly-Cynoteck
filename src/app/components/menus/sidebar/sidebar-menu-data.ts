import {SidebarMenuItemModel} from './sidebar-menu-item/sidebar-menu-item';

export const _MENU_DATA = {
  children: [
    {
      id: 'profile',
      name: 'Profile',
      icon: 'menu-icon-arrow-down',
      iconActive: 'menu-icon-arrow-up',
      children: [
        {
          id: 'profile-name',
          name: 'Profile Name',
          children: [
            {
              id: 'edit-profile',
              name: 'Edit Profile'
            },
            {
              id: 'public-profile',
              name: 'View My Profile',
              linkParams: ['/ProfilePreview'],
            }
          ]
        }, {
          id: 'my-profiles',
          name: 'My Profiles',
          linkParams: ['/MyProfiles'],
        }, {
          id: 'add-profile',
          name: 'Add Profile',
          icon: 'af-icon af-icon-l icon-add',
          linkParams: ['/AddProfile'],
        }
      ]
    },
    {
      id: 'connections',
      name: 'Connections',
      icon: 'menu-icon-arrow-down',
      iconActive: 'menu-icon-arrow-up',
      children: []
    },
    {
      id: 'posts',
      name: 'Posts',
      icon: 'menu-icon-arrow-down',
      iconActive: 'menu-icon-arrow-up',
      children: [
        {
          id: 'publish-job-post',
          name: 'Publish A Job Post',
          icon: 'af-icon af-icon-l icon-jobpost',
          linkParams: ['/AddJobPost'],
        },
        {
          id: 'post-availble-space',
          name: 'Post Available Space',
          icon: 'af-icon af-icon-l icon-available-space'
        },
        {
          type: 'separator',
        },
        {
          id: 'post-positions-placed',
          name: 'Jobs Posted',
          // icon: 'icon-'
          linkParams: ['/MyJobPosts'],
          innerHTML: '<span activeprofilejobpostsnumber class="badge"></span>'
        },
        {
          id: 'post-spaces-placed',
          name: 'Spaces Posted'
        },
        {
          id: 'post-responses',
          name: 'Pending Applications',
          linkParams: ['/MyJobPostsResponses'],
        }
      ]
    }
    // {
    //   id: 'feed',
    //   name: 'Feed',
    //   icon: 'af-icon af-icon-m icon-arrow-right',
    //   iconActive: 'af-icon af-icon-m icon-arrow-left',
    //   linkParams: ['/Feeds'],
    //   children: []
    // }
  ]
};

export const MENU_DATA = new SidebarMenuItemModel(Object.assign({}, _MENU_DATA));
